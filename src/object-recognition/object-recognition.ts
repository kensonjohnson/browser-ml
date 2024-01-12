import "./object-recognition.css";

const video = document.getElementById("webcam") as HTMLVideoElement;
const liveView = document.getElementById("liveView") as HTMLDivElement;
const demosSection = document.getElementById("demos") as HTMLElement;
const enableWebcamButton = document.getElementById(
  "webcamButton"
) as HTMLButtonElement;
