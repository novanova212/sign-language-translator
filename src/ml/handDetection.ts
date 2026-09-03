import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;

export async function initHandLandmarker(): Promise<HandLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return handLandmarker;
}

export function detectHands(
  videoElement: HTMLVideoElement,
  timestamp: number
): HandLandmarkerResult {
  if (!handLandmarker) {
    throw new Error("Hand landmarker belum di-init. Panggil initHandLandmarker() dulu.");
  }
  return handLandmarker.detectForVideo(videoElement, timestamp);
}

export function landmarksToFeatureVector(
  result: HandLandmarkerResult
): number[] | null {
  if (!result || !result.landmarks || result.landmarks.length === 0) {
    return null;
  }

  const features: number[] = [];
  const hand = result.landmarks[0];
  hand.forEach((point) => {
    features.push(point.x, point.y, point.z);
  });

  return features;
}