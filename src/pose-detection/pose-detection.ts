import "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-core";
import { load as loadCoco } from "@tensorflow-models/coco-ssd";
import {
  SupportedModels,
  createDetector,
  Keypoint,
} from "@tensorflow-models/pose-detection";

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

document.querySelector("#form-container")?.appendChild(form);

await tf.ready();
const cocoSsd = await loadCoco();
const poseDetector = await createDetector(SupportedModels.MoveNet);

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (!document) return;

  const container = document.querySelector("#result-container");
  if (!container) return;
  container.innerHTML = "";

  const formData = new FormData(event.target as HTMLFormElement);
  const file = formData.getAll("file")[0] as File | null;
  if (!file) return;

  const image = await createImageFromURL(window.URL.createObjectURL(file));

  handlePredictions(image);
}

function createImageFromURL(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => resolve(image);
    image.onerror = reject;
  });
}

async function handlePredictions(image: HTMLImageElement) {
  // Get predictions from coco-ssd
  // Filter out objects that are not people
  // Filter out predictions that are less than 66% confident
  const predictions = (await cocoSsd.detect(image)).filter(
    (detectedObject) =>
      detectedObject.class === "person" && detectedObject.score > 0.66
  );
  if (predictions.length === 0) return;

  // Render image with bounding boxes
  drawBoundingBoxes(
    image,
    predictions.map((x) => x.bbox)
  );

  // Detect poses and render them
  detectPose(
    image,
    predictions[0].bbox.map((x) => Math.round(x))
  );
}

function drawBoundingBoxes(image: HTMLImageElement, boxes: number[][]) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.font = "24px Arial";
  ctx.fillText("Person: " + boxes.length, 10, 24);
  ctx.stroke();
  boxes.forEach((box) => {
    ctx.beginPath();
    ctx.rect(box[0], box[1], box[2], box[3]);
    ctx.stroke();
  });
  document.querySelector("#result-container")?.appendChild(canvas);
}

async function detectPose(image: HTMLImageElement, box: number[]) {
  const tensor = cropAndFormatImageAsTensor(image, box);
  if (!tensor) return;
  const [{ keypoints, score }] = await poseDetector.estimatePoses(tensor, {
    maxPoses: 1,
    flipHorizontal: false,
  });
  renderPoses(image, box, keypoints, score);
}

function cropAndFormatImageAsTensor(image: HTMLImageElement, box: number[]) {
  const [bboxStartX, bboxStartY, bboxWidth, bboxHeight] = box;

  const size = Math.max(bboxWidth, bboxHeight);

  // Create square canvas and color it black
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);

  // Crop image and draw it on canvas
  ctx.drawImage(
    image,
    bboxStartX,
    bboxStartY,
    bboxWidth,
    bboxHeight,
    0,
    0,
    bboxWidth,
    bboxHeight
  );

  // Convert canvas to tensor
  const imageTensor = tf.browser.fromPixels(canvas);
  // Resize image to 192x192
  return tf.image.resizeBilinear(imageTensor, [192, 192], true).toInt();
}

function renderPoses(
  image: HTMLImageElement,
  box: number[],
  keypoints: Keypoint[],
  score: number = 0
) {
  // find ratio of original image to cropped image
  const croppedSize = Math.max(box[2], box[3]);
  const ratioX = croppedSize / 192;
  const ratioY = croppedSize / 192;

  // convert keypoints to original image coordinates
  keypoints.forEach((keypoint) => {
    keypoint.x = keypoint.x * ratioX + box[0];
    keypoint.y = keypoint.y * ratioY + box[1];
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.font = "24px Arial";
  ctx.fillText("Pose: " + score.toFixed(2), 10, 24);
  ctx.fillText("Keypoints: " + keypoints.length, 10, 48);
  ctx.stroke();
  // change color to bright green
  ctx.fillStyle = "rgb(0, 255, 0)";
  ctx.strokeStyle = "rgb(0, 255, 0)";
  keypoints.forEach((keypoint) => {
    ctx.beginPath();
    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
    ctx.stroke();
  });
  document.querySelector("#result-container")?.appendChild(canvas);
}
