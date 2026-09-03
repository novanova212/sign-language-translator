import * as tf from "@tensorflow/tfjs";

let model: tf.LayersModel | null = null;

export const LABELS: string[] = ["A", "B", "C", "D", "E"]; // ganti sesuai dataset kamu

export async function loadClassifier(
  modelUrl: string = "/models/sign_model/model.json"
): Promise<tf.LayersModel> {
  model = await tf.loadLayersModel(modelUrl);
  return model;
}

export function predict(
  featureVector: number[] | null
): { label: string; confidence: number } | null {
  if (!model) {
    throw new Error("Model belum dimuat. Panggil loadClassifier() dulu.");
  }
  if (!featureVector) return null;

  const input = tf.tensor2d([featureVector]);
  const output = model.predict(input) as tf.Tensor;
  const scores = output.dataSync();

  input.dispose();
  output.dispose();

  const maxIndex = scores.indexOf(Math.max(...Array.from(scores)));
  return {
    label: LABELS[maxIndex] ?? "?",
    confidence: scores[maxIndex],
  };
}