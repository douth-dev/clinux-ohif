import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";

export default function initCornerstoneDICOMImageLoader() {
  let maxWebWorkers = 2;

  if (navigator.hardwareConcurrency) {
    maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7);
  }

  var config = {
    maxWebWorkers,
    startWebWorkersOnDemand: false,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        strict: false,
      },
    },
  };

  cornerstoneDICOMImageLoader.init(config);
}
