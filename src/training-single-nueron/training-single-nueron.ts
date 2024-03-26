import * as tf from "@tensorflow/tfjs";
import { INPUTS, OUTPUTS } from "./data";

await tf.ready();

// Shuffle the data in a way that inputs still match the outputs
tf.util.shuffleCombo(INPUTS, OUTPUTS);

// Convert the data to tensors
const inputsTensor = tf.tensor2d(INPUTS);
const outputsTensor = tf.tensor1d(OUTPUTS);

// Normalize the data
const featureResults = normalize(inputsTensor);
console.log("Normalized Values:");
featureResults.normalizedValues.print();

console.log("Min Values:");
featureResults.minValues.print();

console.log("Max Values:");
featureResults.maxValues.print();

inputsTensor.dispose();

// Define the model
const model = tf.sequential();

// 1 dense layer with 1 unit (neuron) and input shape of 2
model.add(tf.layers.dense({ units: 1, inputShape: [2] }));

model.summary();

// Train the model
train();

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
      batchSize: 64, // Becuase there is a lot of training data, we will use a batch size of 64
      epochs: 50, // Run for 10 epochs
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (!logs) return;
          const epochPercentage = (epoch / 50) * 100;
          console.log(
            "Epoch: " +
              epoch +
              " Loss: " +
              Math.sqrt(logs.loss).toFixed(0) +
              "\nProgress: " +
              epochPercentage.toFixed(0) +
              "%"
          );
        },
        onTrainEnd() {
          console.log("Progress: 100%");
        },
      },
    }
  );

  outputsTensor.dispose();
  featureResults.normalizedValues.dispose();

  // Print the results
  const loss = results.history.loss[results.history.loss.length - 1] as number;
  console.log("Average error loss: " + Math.sqrt(loss).toFixed(0));

  const validationLoss = results.history.val_loss[
    results.history.val_loss.length - 1
  ] as number;
  console.log(
    "Average validation error loss: " + Math.sqrt(validationLoss).toFixed(0)
  );

  // Once trained, evaluate the model
  evaluate();
}

function evaluate() {
  // Predict answer for single piece of data
  tf.tidy(() => {
    const newInput = normalize(
      tf.tensor2d([[750, 1]]),
      featureResults.minValues as tf.Tensor1D,
      featureResults.maxValues as tf.Tensor1D
    ).normalizedValues;

    const output = model.predict(newInput) as tf.Tensor;
    output.print();
  });

  // Clean up tensors
  featureResults.minValues.dispose();
  featureResults.maxValues.dispose();
  model.dispose();

  console.log(tf.memory().numTensors);
}
