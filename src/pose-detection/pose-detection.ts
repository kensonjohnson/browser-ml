import "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-core";
import { load as loadCoco } from "@tensorflow-models/coco-ssd";
import {
  SupportedModels,
  createDetector,
} from "@tensorflow-models/pose-detection";

await tf.ready();
const cocoSsd = await loadCoco();
const poseDetector = await createDetector(SupportedModels.MoveNet);

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (!document) return;
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
  const predictions = await cocoSsd.detect(image);
  if (
    predictions.length &&
    predictions[0].class === "person" &&
    predictions[0].score > 0.66
  ) {
    detectPose(
      image,
      predictions[0].bbox.map((x) => Math.round(x))
    );
  }
}

async function detectPose(image: HTMLImageElement, box: number[]) {
  // get bounding box height and width
  let width = box[2] - box[0];
  let height = box[3] - box[1];
  let startingX = box[0];
  let startingY = box[1];
  if (height > width) {
    const padding = Math.round((height - width) / 2);
    if (padding > box[0] || padding > image.width - box[2]) {
      startingX = 0;
      width = image.width;
      height = image.width;
      if (height + startingY > image.height) {
        startingY = 0;
        height = image.height;
      }
    } else {
      startingX -= padding;
      width += padding * 2;
    }
  } else {
    const padding = (width - height) / 2;
    if (padding > startingY || padding > image.height - box[3]) {
      startingY = 0;
      height = image.height;
      width = image.height;
      if (width + startingX > image.width) {
        startingX = 0;
        width = image.width;
      }
    } else {
      startingY -= padding;
      height += padding * 2;
    }
  }
  // convert image to tensor 4d
  const imageTensor = tf.browser.fromPixels(image);

  // define crop details
  const cropStartingPoint = [startingY, startingX, 0];
  const cropSize = [height, width, 3];
  console.log(startingY, height, startingY + height);
  const croppedTensor = tf.slice(imageTensor, cropStartingPoint, cropSize);

  // resize cropped image to 192x192
  const resizedTensor = tf.image
    .resizeBilinear(croppedTensor, [192, 192], true)
    .toInt();

  const [{ keypoints, score }] = await poseDetector.estimatePoses(
    resizedTensor,
    {
      maxPoses: 1,
      flipHorizontal: false,
    }
  );

  console.log("Pose: ", keypoints, score);

  // get ratio of resized image to original image
  const ratioX = width / 192;
  const ratioY = height / 192;

  // convert keypoints to original image coordinates
  keypoints.forEach((keypoint) => {
    keypoint.x = keypoint.x * ratioX + startingX;
    keypoint.y = keypoint.y * ratioY + startingY;
  });

  // convert original image to canvas and draw pose on canvas
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
  ctx.fillText("Pose: " + score!.toFixed(2), 10, 24);
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
  document.querySelector("body")?.appendChild(canvas);
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
