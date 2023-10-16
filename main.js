import { RenderingEngine, imageLoader } from "@cornerstonejs/core";
import init from "./init";
import { ViewportType } from "@cornerstonejs/core/dist/esm/enums";

await init();

const renderingEngineId = "myRenderingEngine";
const renderingEngine = new RenderingEngine(renderingEngineId);

const series = await fetch(
  "https://bioscan.redirectme.net/clinuxview/pathpacs/52432543/1011981"
).then((response) => response.json());

const images = imageLoader.loadAndCacheImages(
  series.map((serie) => "wadouri:" + serie)
);

const studies = await Promise.all(images).then((images) => {
  return images.reduce((studies, image) => {
    const studyName = image.data.string("x0008103e");

    studies[studyName] = studies[studyName] ?? [];
    studies[studyName].push(image);

    return studies;
  }, {});
});

const viewportId = "MAIN_IMAGE";
const element = document.getElementById("main-image");

const viewportInput = {
  viewportId,
  element,
  type: ViewportType.STACK,
};

renderingEngine.enableElement(viewportInput);

const viewport = renderingEngine.getViewport(viewportId);

viewport.setStack(
  studies[Object.keys(studies)[0]].map((study) => study.imageId)
);

viewport.render();

Object.keys(studies).forEach((study) => {
  const viewportId = study;
  const menu = document.getElementById("drawer");
  const element = document.createElement("div");

  element.style.width = "100%";
  element.style.height = "250px";
  element.onclick = (e) => {
    const viewport = renderingEngine.getViewport("MAIN_IMAGE");

    viewport.setStack(studies[study].map((study) => study.imageId));
    viewport.render();
  };

  menu.appendChild(element);

  renderingEngine.enableElement({
    viewportId,
    element,
    type: ViewportType.STACK,
  });

  const viewport = renderingEngine.getViewport(viewportId);

  viewport.setStack(studies[study].map((study) => study.imageId));

  viewport.render();
});
