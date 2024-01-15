import "./object-recognition.css";
import "@tensorflow/tfjs";
import { load, ObjectDetection } from "@tensorflow-models/coco-ssd";

// This is only for GitHub Pages. Delete this for any other hosting environment.
import { fixGHPagesUrls } from "../../utils/gh-pages-urls";
if (!import.meta.env.DEV) {
  fixGHPagesUrls();
}

const video = document.getElementById("webcam") as HTMLVideoElement;
const liveView = document.getElementById("liveView") as HTMLDivElement;
const demosSection = document.getElementById("demos") as HTMLElement;
const enableWebcamButton = document.getElementById(
  "webcamButton"
) as HTMLButtonElement;

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Placeholder function for next step. Paste over this in the next step.
// Enable the live webcam view and start classification.
function enableCam(event: MouseEvent) {
  // Only continue if the COCO-SSD has finished loading.
  if (!model) {
    return;
  }
  console.log(event.target);
  // Hide the button once clicked.
  const element = event.target as HTMLButtonElement;
  element.classList.add("removed");

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

// Store the resulting model in the global scope of our app.
var model: ObjectDetection;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment
// to get everything needed to run.
load().then((loadedModel) => {
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove("invisible");
});

var children: HTMLElement[] = [];

function predictWebcam() {
  // Now let's start classifying a frame in the stream.
  model.detect(video).then((predictions) => {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.length = 0;

    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (const prediction of predictions) {
      // If we are over 66% sure we are sure we classified it right, draw it!
      if (prediction.score > 0.66) {
        const p = document.createElement("p");
        p.innerText =
          prediction.class +
          " - with " +
          Math.round(prediction.score * 100) +
          "% confidence.";
        p.setAttribute(
          "style",
          `margin-left: ${prediction.bbox[0]}px; margin-top: ${
            prediction.bbox[1] - 10
          }px; width: ${prediction.bbox[2] - 10}px; top: 0; left: 0;`
        );

        const highlighter = document.createElement("div");
        highlighter.setAttribute("class", "highlighter");
        highlighter.setAttribute(
          "style",
          `left: ${prediction.bbox[0]}px; top: ${prediction.bbox[1]}px; width: ${prediction.bbox[2]}px; height: ${prediction.bbox[3]}px;`
        );

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}
