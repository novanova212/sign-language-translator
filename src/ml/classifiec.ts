// classifier.ts
// Load model TF.js hasil training sendiri (training/train_model.py +
// convert_to_tfjs.py) dan jalankan prediksi dari fitur 2 tangan.

import * as tf from "@tensorflow/tfjs";
import type { HandFeatureResult } from "./handDetection";

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

/**
 * Susun 128 fitur, urutannya HARUS sama persis dengan header CSV
 * yang dihasilkan training/collect_landmarks.py:
 * [right_hand_prob, left_hand_prob, ...right_coords(63), ...left_coords(63)]
 */
function toInputTensor(feature: HandFeatureResult): tf.Tensor2D {
  const flat = [
    feature.rightHandProb,
    feature.leftHandProb,
    ...feature.rightCoords,
    ...feature.leftCoords,
  ];
  return tf.tensor2d([flat]);
}

export interface PredictionResult {
  label: string;
  confidence: number;
}

export async function predictSign(
  feature: HandFeatureResult | null
): Promise<PredictionResult | null> {
  if (!model || !feature) return null;

  const inputTensor = toInputTensor(feature);
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