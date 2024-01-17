import "@tensorflow/tfjs";
import * as tf from "@tensorflow/tfjs-core";
import { load as loadCoco } from "@tensorflow-models/coco-ssd";
import type { ObjectDetection } from "@tensorflow-models/coco-ssd";
import * as poseDetection from "@tensorflow-models/pose-detection";

await tf.ready();
const cocoSsd: ObjectDetection = await loadCoco();
const detector = await poseDetection.createDetector(
  poseDetection.SupportedModels.MoveNet
);

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

  //   // convert image to tensor 4d
  //   const tensor = tf.browser.fromPixels(image);

  //   const tensor4d = tensor.expandDims(0) as Tensor4D;

  //   const normalizedX1 = predictions[0].bbox[0] / image.width;
  //   const normalizedY1 = predictions[0].bbox[1] / image.height;
  //   const normalizedX2 = predictions[0].bbox[2] / image.width;
  //   const normalizedY2 = predictions[0].bbox[3] / image.height;
  //   //   crop image to bounding box
  //   const croppedTensor4d = tf.image.cropAndResize(
  //     tensor4d,
  //     [[normalizedY1, normalizedX1, normalizedY2, normalizedX2]],
  //     [0],
  //     [192, 192]
  //   );

  //   const croppedTensor = croppedTensor4d.squeeze([0]).cast("int32") as Tensor3D;

  //   // convert tensor back to image and render to screen using a canvas
  //   const canvas = document.createElement("canvas");
  //   canvas.width = 192;
  //   canvas.height = 192;

  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;
  //   const croppedImage = await tf.browser.toPixels(croppedTensor);
  //   ctx.putImageData(new ImageData(croppedImage, 192, 192), 0, 0);
  //   document.querySelector("body")?.appendChild(canvas);
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
    } else {
      startingX -= padding;
      width += padding * 2;
    }
  } else {
    const padding = (width - height) / 2;
    if (padding > startingY || padding > image.height - box[3]) {
      startingY = 0;
      width = image.height;
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
  const croppedTensor = tf.slice(imageTensor, cropStartingPoint, cropSize);

  // resize cropped image to 192x192
  const resizedTensor = tf.image
    .resizeBilinear(croppedTensor, [192, 192], true)
    .toInt();

  const [pose] = await detector.estimatePoses(resizedTensor, {
    maxPoses: 1,
    flipHorizontal: false,
  });

  console.log("Pose: ", pose);

  // convert tensor back to image and render to screen using a canvas
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const croppedImage = await tf.browser.toPixels(resizedTensor);
  ctx.putImageData(new ImageData(croppedImage, 192, 192), 0, 0);

  // draw pose on canvas
  ctx.beginPath();
  ctx.arc(pose.keypoints[0].x, pose.keypoints[0].y, 5, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();

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
