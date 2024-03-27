import * as tf from "@tensorflow/tfjs";
import { INPUTS, OUTPUTS } from "./data";

// Shuffle the data in a way that inputs still match the outputs
tf.util.shuffleCombo(INPUTS, OUTPUTS);

// Setup data container
const dataContainer = document.getElementById(
  "raw-data-table"
) as HTMLTableElement;

const tableBody = document.createElement("tbody");
tableBody.classList.add("table-body");
dataContainer.appendChild(tableBody);

for (let i = 0; i < INPUTS.length; i++) {
  const input = INPUTS[i];
  const output = OUTPUTS[i];

  const row = document.createElement("tr");
  row.classList.add("table-row");

  const sqftCell = document.createElement("td");
  sqftCell.textContent = input[0].toString();
  row.appendChild(sqftCell);

  const bedroomsCell = document.createElement("td");
  bedroomsCell.textContent = input[1].toString();
  row.appendChild(bedroomsCell);

  const priceCell = document.createElement("td");
  priceCell.textContent = output.toString();
  row.appendChild(priceCell);

  tableBody.appendChild(row);
}

await tf.ready();

// Convert the data to tensors
const inputsTensor = tf.tensor2d(INPUTS);
const outputsTensor = tf.tensor1d(OUTPUTS);

// Normalize the data
const featureResults = normalize(inputsTensor);

// Add the normalized values to the table
const normalizedDataTable = document.getElementById(
  "normalized-data-table"
) as HTMLTableElement;

const normalizedTableBody = document.createElement("tbody");
normalizedTableBody.classList.add("table-body");

const normalizedDataInputArray =
  featureResults.normalizedValues.arraySync() as number[][];

for (let i = 0; i < normalizedDataInputArray.length; i++) {
  const input = normalizedDataInputArray[i];
  const output = OUTPUTS[i];

  const row = document.createElement("tr");
  row.classList.add("table-row");

  const sqftCell = document.createElement("td");
  sqftCell.textContent = input[0].toFixed(2).toString();
  row.appendChild(sqftCell);

  const bedroomsCell = document.createElement("td");
  bedroomsCell.textContent = input[1].toFixed(2).toString();
  row.appendChild(bedroomsCell);

  const priceCell = document.createElement("td");
  priceCell.textContent = output.toString();
  row.appendChild(priceCell);

  normalizedTableBody.appendChild(row);
}

normalizedDataTable.appendChild(normalizedTableBody);

// Prepare training output container
const startTrainingButton = document.getElementById(
  "train-button"
) as HTMLButtonElement;
startTrainingButton.addEventListener("click", () => {
  startTrainingButton.disabled = true;
  train();
});
let trainingOutput = "Waiting for training to start...";
const trainingOutputContainer = document.querySelector(
  ".training-output"
) as HTMLDivElement;
trainingOutputContainer.innerHTML = `<pre>${trainingOutput}</pre>`;

// Prepare the evaluation form
const evaluationForm = document.getElementById(
  "evaluation-form"
) as HTMLFormElement;
evaluationForm.onsubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(evaluationForm);
  const sqftInput = formData.get("sqft") as string;
  const bedroomsInput = formData.get("bedrooms") as string;

  const sqft = parseInt(sqftInput);
  const bedrooms = parseInt(bedroomsInput);

  console.log("sqft: ", sqft, "bedrooms: ", bedrooms);

  if (isNaN(sqft) || isNaN(bedrooms)) {
    alert("Please enter valid numbers");
    return;
  }

  const result = evaluate(sqft, bedrooms);
  console.log("result: ", result);

  const evaluationOutputContainer = document.querySelector(
    ".evaluation-output"
  ) as HTMLDivElement;

  evaluationOutputContainer.innerText = `Predicted price: $${result} +- $${lossAfterTraining.toFixed(
    0
  )}`;
};

// get the min and max values of the features
const minValues = featureResults.minValues.arraySync() as number[];
const maxValues = featureResults.maxValues.arraySync() as number[];
console.log(maxValues, minValues);

// Update the inputs to be within the range of the min and max values
const sqftInput = document.getElementById("sqft-input") as HTMLInputElement;
sqftInput.min = minValues[0].toString();
sqftInput.max = maxValues[0].toString();

const bedroomsInput = document.getElementById(
  "bedrooms-input"
) as HTMLInputElement;
bedroomsInput.min = minValues[1].toString();
bedroomsInput.max = maxValues[1].toString();

// Define the model
const model = tf.sequential();

// 1 dense layer with 1 unit (neuron) and input shape of 2
model.add(tf.layers.dense({ units: 1, inputShape: [2] }));

let lossAfterTraining = 0;

function normalize(tensor: tf.Tensor2D, min?: tf.Tensor1D, max?: tf.Tensor1D) {
  // tf.tidy automatically cleans up any tensors that aren't returned
  return tf.tidy(() => {
    // Find the min and max values of the tensor
    const minValues = min ?? tf.min(tensor, 0);
    const maxValues = max ?? tf.max(tensor, 0);

    // Subtract the min from every value in the tensor
    const tensorMinusMin = tf.sub(tensor, minValues);

    // Calculate the range of possible values
    const range = tf.sub(maxValues, minValues);

    // Divide each value by the range
    const normalizedValues = tf.div(tensorMinusMin, range);

    return {
      normalizedValues,
      minValues,
      maxValues,
    };
  });
}

async function train() {
  const learningRate = 0.01;

  // Compile the model with specified learning rate and loss function
  model.compile({
    optimizer: tf.train.sgd(learningRate),
    loss: "meanSquaredError",
  });

  // Train the model
  const results = await model.fit(
    featureResults.normalizedValues,
    outputsTensor,
    {
      validationSplit: 0.15, // Set aside 15% of the data for validation
      shuffle: true, // Ensure the data is shuffled before each epoch
      batchSize: 32, // Becuase there is a lot of training data, we will use a batch size of 32
      epochs: 50, // Run for 50 epochs
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (!logs) return;
          const epochPercentage = (epoch / 50) * 100;
          const newTrainingOutput = `[${epoch}]: Epoch: ${
            epoch + 1
          } Loss: ${Math.sqrt(logs.loss).toFixed(
            0
          )} Progress: ${epochPercentage.toFixed(0)}%`;
          trainingOutput += "\n" + newTrainingOutput;
          trainingOutputContainer.innerHTML = `<pre>${trainingOutput}</pre>`;
          trainingOutputContainer.scrollTop =
            trainingOutputContainer.scrollHeight;
        },
        onTrainEnd() {
          const newTrainingOutput = "Progress: 100% Training complete!";
          trainingOutput += "\n" + newTrainingOutput;
          trainingOutputContainer.innerHTML = `<pre>${trainingOutput}</pre>`;
          trainingOutputContainer.scrollTop =
            trainingOutputContainer.scrollHeight;
          const evaluationSubmitButton = document.getElementById(
            "evaluation-submit-button"
          ) as HTMLButtonElement;
          evaluationSubmitButton.disabled = false;
        },
      },
    }
  );

  outputsTensor.dispose();
  featureResults.normalizedValues.dispose();

  // Print the results
  const loss = results.history.loss[results.history.loss.length - 1] as number;
  const validationLoss = results.history.val_loss[
    results.history.val_loss.length - 1
  ] as number;

  const lossTotals = `Average error loss: ${Math.sqrt(loss).toFixed(
    0
  )}\nAverage validation error loss: ${Math.sqrt(validationLoss).toFixed(0)}`;

  trainingOutputContainer.innerHTML = `<pre>${trainingOutput}\n${lossTotals}</pre>`;
  trainingOutputContainer.scrollTop = trainingOutputContainer.scrollHeight;

  lossAfterTraining = Math.sqrt(loss);
}

function evaluate(sqft: number, bedrooms: number) {
  let result = 0;
  // Predict answer for single piece of data
  tf.tidy(() => {
    const newInput = normalize(
      tf.tensor2d([[sqft, bedrooms]]),
      featureResults.minValues as tf.Tensor1D,
      featureResults.maxValues as tf.Tensor1D
    ).normalizedValues;

    const output = model.predict(newInput) as tf.Tensor;
    result = output.dataSync()[0];
  });
  return result.toFixed(0);
}

// Clean up tensors - not currently used
// function cleanup() {
//   console.log("Number of tensors before cleanup: " + tf.memory().numTensors);
//   featureResults.minValues.dispose();
//   featureResults.maxValues.dispose();
//   model.dispose();

//   console.log("Number of tensors after cleanup: ", tf.memory().numTensors);
// }
