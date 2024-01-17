import "@tensorflow/tfjs";
import { load as loadCoco } from "@tensorflow-models/coco-ssd";
import type { ObjectDetection } from "@tensorflow-models/coco-ssd";

const cocoSsd: ObjectDetection = await loadCoco();

function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (!document) return;
  const formData = new FormData(event.target as HTMLFormElement);
  const file = formData.getAll("file")[0] as File;

  const img = new Image();
  img.src = window.URL.createObjectURL(file);
  img.onload = handlePredictions.bind(null, img);
}

async function handlePredictions(img: HTMLImageElement) {
  cocoSsd.detect(img).then((predictions) => {
    console.log("Predictions: ", predictions);
  });
}

const form = document.createElement("form");
form.classList.add("pose-image-form");
const input = document.createElement("input");
input.setAttribute("type", "file");
input.setAttribute("id", "file");
input.setAttribute("name", "file");
input.setAttribute("accept", "image/*");

const submitButton = document.createElement("button");
submitButton.setAttribute("type", "submit");
submitButton.innerText = "Upload Image";

form.appendChild(input);
form.appendChild(submitButton);
form.onsubmit = handleSubmit;

document.querySelector("body")?.appendChild(form);
