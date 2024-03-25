import { BarChartOpts, render, visor } from "@tensorflow/tfjs-vis";

createButtons();

function createButtons() {
  const container = document.querySelector(
    ".button-container"
  ) as HTMLDivElement;
  if (!container) {
    console.log("No container found");
    return;
  }

  // Scatterplot buttons
  const scatterplotButton = document.createElement("button");
  scatterplotButton.innerText = "Scatterplot";
  scatterplotButton.onclick = createScatterplot;
  container.appendChild(scatterplotButton);

  const modalScatterplotButton = document.createElement("button");
  modalScatterplotButton.innerText = "Modal Scatterplot";
  modalScatterplotButton.onclick = createScatterplotModal;
  container.appendChild(modalScatterplotButton);

  // Bar chart buttons
  const barChartButton = document.createElement("button");
  barChartButton.innerText = "Bar Chart";
  barChartButton.onclick = createBarChart;
  container.appendChild(barChartButton);

  const modalBarChartButton = document.createElement("button");
  modalBarChartButton.innerText = "Modal Bar Chart";
  modalBarChartButton.onclick = createBarChartModal;
  container.appendChild(modalBarChartButton);

  // Line chart buttons
  const lineChartButton = document.createElement("button");
  lineChartButton.innerText = "Line Chart";
  lineChartButton.onclick = createLineChart;
  container.appendChild(lineChartButton);

  const modalLineChartButton = document.createElement("button");
  modalLineChartButton.innerText = "Modal Line Chart";
  modalLineChartButton.onclick = createLineChartModal;
  container.appendChild(modalLineChartButton);
}

function createScatterplot() {
  const surface = document.getElementById("visor") as HTMLDivElement;
  document.body.appendChild(surface);

  const scatterplotLabels = ["First", "Second"];
  const series1 = [];
  const series2 = [];
  for (let i = 0; i < 100; i++) {
    series1[i] = { x: i, y: Math.random() * 100 };
    series2[i] = { x: i, y: Math.random() * 100 };
  }

  const scatterPlotData = { values: [series1, series2], scatterplotLabels };
  render.scatterplot(surface, scatterPlotData);
}

function createScatterplotModal() {
  const modelLabels = ["First", "Second"];

  const serie1 = [];
  const serie2 = [];
  for (let i = 0; i < 100; i++) {
    serie1[i] = { x: i, y: Math.random() * 100 };
    serie2[i] = { x: i, y: Math.random() * 100 };
  }

  const modelData = { values: [serie1, serie2], modelLabels };

  render.scatterplot({ name: "my Plots" }, modelData);
  const visorInstance = visor();
  if (!visorInstance.isOpen()) {
    visorInstance.toggle();
  }
}

function createBarChart() {
  const surface = document.getElementById("visor") as HTMLDivElement;
  const data = [
    { index: 0, value: 100 },
    { index: 1, value: 200 },
    { index: 2, value: 150 },
    { index: 2, value: 250 },
  ];

  render.barchart(surface, data);
}

function createBarChartModal() {
  const data = [
    { index: 0, value: 100 },
    { index: 1, value: 200 },
    { index: 2, value: 150 },
    { index: 2, value: 250 },
  ];

  const opts: BarChartOpts = {
    color: ["red", "green", "blue"],
  };

  render.barchart({ name: "my Graphs" }, data, opts);
  const visorInstance = visor();
  if (!visorInstance.isOpen()) {
    visorInstance.toggle();
  }
}

function createLineChart() {
  const surface = document.getElementById("visor") as HTMLDivElement;
  const values = [
    { x: 1, y: 20 },
    { x: 2, y: 30 },
    { x: 3, y: 5 },
    { x: 4, y: 12 },
  ];

  render.linechart(surface, { values });
}

function createLineChartModal() {
  let values = [
    { x: 1, y: 20 },
    { x: 2, y: 30 },
    { x: 3, y: 5 },
    { x: 4, y: 12 },
  ];

  render.linechart({ name: "my Lines" }, { values });
  const visorInstance = visor();
  if (!visorInstance.isOpen()) {
    visorInstance.toggle();
  }
}
