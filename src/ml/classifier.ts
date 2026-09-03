// classifier.ts
// Load model TF.js hasil training sendiri (training/train_model.py +
// convert_to_tfjs.py) dan jalankan prediksi dari 128 fitur numerik.

import * as tf from "@tensorflow/tfjs";

let model: tf.LayersModel | null = null;

// GANTI array ini sesuai isi file `labels.txt` yang dihasilkan
// training/train_model.py — urutannya HARUS sama persis.
export const LABELS: string[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
];

export async function loadModel(
  modelUrl = "/models/sign_model/model.json"
): Promise<tf.LayersModel> {
  if (model) return model;
  model = await tf.loadLayersModel(modelUrl);
  return model;
}

export interface PredictionResult {
  label: string;
  confidence: number;
}

/**
 * @param features - 128 angka flat, hasil dari
 *   handDetection.ts -> landmarksToFeatureVector()
 */
export async function predictSign(
  features: number[] | null
): Promise<PredictionResult | null> {
  if (!model || !features) return null;

  const inputTensor = tf.tensor2d([features]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const scores = await prediction.data();

  inputTensor.dispose();
  prediction.dispose();

  const maxIndex = scores.indexOf(Math.max(...scores));
  return {
    label: LABELS[maxIndex] ?? "?",
    confidence: scores[maxIndex],
  };
}