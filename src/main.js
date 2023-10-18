import { RenderingEngine, imageLoader } from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import {
  ToolGroupManager,
  PanTool,
  WindowLevelTool,
  StackScrollTool,
  ZoomTool,
  LengthTool,
  CobbAngleTool,
  AngleTool,
} from "@cornerstonejs/tools";
import { ViewportType } from "@cornerstonejs/core/dist/esm/enums";
import { MouseBindings } from "@cornerstonejs/tools/dist/esm/enums";

import init from "./cornerstone/init";

const loading = document.getElementById("loading");
const loadingProgress = document.getElementById("loading-progress");

loading.style.visibility = "visible";

await init();

const toolGroupId = "MAIN_IMAGE_TOOL_GROUP";
cornerstoneTools.addTool(LengthTool);
cornerstoneTools.addTool(PanTool);
cornerstoneTools.addTool(WindowLevelTool);
cornerstoneTools.addTool(StackScrollTool);
cornerstoneTools.addTool(ZoomTool);
cornerstoneTools.addTool(CobbAngleTool);
cornerstoneTools.addTool(AngleTool);

const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
toolGroup.addTool(LengthTool.toolName);
toolGroup.addTool(WindowLevelTool.toolName);
toolGroup.addTool(PanTool.toolName);
toolGroup.addTool(ZoomTool.toolName);
toolGroup.addTool(StackScrollTool.toolName);
toolGroup.addTool(CobbAngleTool.toolName);
toolGroup.addTool(AngleTool.toolName);

toolGroup.setToolActive(ZoomTool.toolName, {
  bindings: [{ numTouchPoints: 2 }],
});

toolGroup.setToolActive(StackScrollTool.toolName, {
  bindings: [{ numTouchPoints: 3 }],
});

toolGroup.setToolPassive(CobbAngleTool.toolName);
toolGroup.setToolPassive(AngleTool.toolName);

toolGroup.setToolActive(AngleTool.toolName, {
  bindings: [
    {
      mouseButton: MouseBindings.Primary, // Left Click
    },
  ],
});

/*toolGroup.setToolActive(LengthTool.toolName, {
  bindings: [
    {
      mouseButton: MouseBindings.Primary, // Left Click
    },
  ],
});*/

/*toolGroup.setToolActive(WindowLevelTool.toolName, {
  bindings: [
    {
      mouseButton: MouseBindings.Primary, // Left Click
    },
  ],
});*/

const renderingEngineId = "myRenderingEngine";
const renderingEngine = new RenderingEngine(renderingEngineId);

const series = await fetch(
  "https://bioscan.redirectme.net/clinuxview/pathpacs/52432543/1011981"
).then((response) => response.json());

loadingProgress.max = series.length;
loadingProgress.value = 0;

const images = series.map(async (serie) => {
  const image = await imageLoader.loadAndCacheImage("wadouri:" + serie);

  console.log(image.data.string("x00200013"));

  loadingProgress.value += 1;

  return image;
});

const studies = await Promise.all(images).then((images) => {
  images.sort((a, b) => {
    return a.data.string("x00200013") - b.data.string("x00200013");
  });

  return images.reduce((studies, image) => {
    const studyName = image.data.string("x0008103e");

    studies[studyName] = studies[studyName] ?? [];
    studies[studyName].push(image);

    return studies;
  }, {});
});

const viewportId = "MAIN_IMAGE";
const element = document.getElementById("main-image");

element.oncontextmenu = (e) => e.preventDefault();

const viewportInput = {
  viewportId,
  element,
  type: ViewportType.STACK,
};

renderingEngine.enableElement(viewportInput);

const viewport = renderingEngine.getViewport(viewportId);
toolGroup.addViewport(viewportId, renderingEngineId);

viewport
  .setStack(studies[Object.keys(studies)[0]].map((study) => study.imageId))
  .then(() => {
    const image = viewport.csImage;

    const imageObj = {};

    // https://www.dicomlibrary.com/dicom/dicom-tags/

    imageObj.windowCenter = image.data.string("x00281050");
    imageObj.windowWidth = image.data.string("x00281051");
    imageObj.accessionNumber = image.data.string("x00080050");
    imageObj.acquisitionTime = image.data.string("x00080032");
    imageObj.bitsAllocated = image.data.string("x00280100");
    imageObj.highBit = image.data.string("x00280102");
    imageObj.instanceNumber = image.data.string("x00200013");
    imageObj.institutionName = image.data.string("x00080080");
    imageObj.patientAge = image.data.string("x00101010");
    imageObj.patientID = image.data.string("x00100020");
    imageObj.patientName = image.data.string("x00100010");
    imageObj.patientSex = image.data.string("x00100040");
    imageObj.pixelRepresentation = image.data.string("x00280103");
    imageObj.seriesDescription = image.data.string("x0008103e");
    imageObj.seriesNumber = image.data.string("x00200011");
    imageObj.sliceLocation = image.data.string("x00201041");
    imageObj.sliceThickness = image.data.string("x00180050");
    imageObj.stationName = image.data.string("x00081010");
    imageObj.studyDescription = image.data.string("x00081030");

    console.log(
      `${imageObj.patientName} (${imageObj.patientAge}) - ${imageObj.patientSex}`
    );
    console.log(imageObj.patientID);

    console.log(imageObj);
  });

loading.style.visibility = "hidden";
viewport.render();

Object.keys(studies).forEach((study) => {
  const viewportId = study;

  const menu = document.getElementById("drawer");

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "5px";

  const image = document.createElement("div");
  image.style.height = "200px";
  image.style.padding = "5px";
  image.style.border = "solid 1px #FFFFFF";
  image.style.backgroundColor = "#000000";
  image.style.borderRadius = "10px";

  const caption = document.createElement("div");
  caption.innerHTML = study;
  caption.style.color = "#FFFFFF";

  container.appendChild(image);
  container.appendChild(caption);

  container.onclick = (e) => {
    const viewport = renderingEngine.getViewport("MAIN_IMAGE");

    viewport.setStack(studies[study].map((study) => study.imageId));
    viewport.render();

    document.getElementById("drawer-toggle").checked = false;
  };

  menu.appendChild(container);

  renderingEngine.enableElement({
    viewportId,
    element: image,
    type: ViewportType.STACK,
  });

  const viewport = renderingEngine.getViewport(viewportId);

  viewport.setStack(studies[study].map((study) => study.imageId));

  viewport.render();
});

document.getElementById("next-image").onclick = () => {
  const viewport = renderingEngine.getViewport("MAIN_IMAGE");

  const currentImageIdIndex = viewport.getCurrentImageIdIndex();
  const numImages = viewport.getImageIds().length;
  let newImageIdIndex = currentImageIdIndex + 1;

  newImageIdIndex = Math.min(newImageIdIndex, numImages - 1);

  viewport.setImageIdIndex(newImageIdIndex);

  const image = viewport.csImage;
  console.log(image.data.string("x00200013"));
};

document.getElementById("prev-image").onclick = () => {
  const viewport = renderingEngine.getViewport("MAIN_IMAGE");

  const currentImageIdIndex = viewport.getCurrentImageIdIndex();

  let newImageIdIndex = currentImageIdIndex - 1;

  newImageIdIndex = Math.max(newImageIdIndex, 0);

  viewport.setImageIdIndex(newImageIdIndex);
  const image = viewport.csImage;
  console.log(image.data.string("x00200013"));
};
