// handDetection.ts
// Setup MediaPipe Hands untuk mendeteksi landmark DUA tangan sekaligus,
// karena banyak huruf BISINDO butuh dua tangan (beda dari ASL).

import { Hands, type Results } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

export interface HandFeatureResult {
  rightHandProb: number;
  leftHandProb: number;
  rightCoords: number[]; // 63 angka (21 titik x,y,z), 0 semua kalau tak terdeteksi
  leftCoords: number[]; // 63 angka
}

const EMPTY_COORDS = () => new Array(63).fill(0);

/**
 * Ubah hasil mentah MediaPipe jadi 128 fitur numerik,
 * urutannya HARUS sama persis dengan collect_landmarks.py di training/.
 */
function toFeatureResult(results: Results): HandFeatureResult {
  let rightHandProb = 0;
  let leftHandProb = 0;
  let rightCoords = EMPTY_COORDS();
  let leftCoords = EMPTY_COORDS();

  const landmarksList = results.multiHandLandmarks;
  const handednessList = results.multiHandedness;

  if (landmarksList && handednessList) {
    landmarksList.forEach((landmarks, i) => {
      const handedness = handednessList[i];
      const coords = landmarks.flatMap((p) => [p.x, p.y, p.z]);

      if (handedness.label === "Right") {
        rightHandProb = handedness.score;
        rightCoords = coords;
      } else if (handedness.label === "Left") {
        leftHandProb = handedness.score;
        leftCoords = coords;
      }
    });
  }

  return { rightHandProb, leftHandProb, rightCoords, leftCoords };
}

export function createHandDetector(
  onResults: (result: HandFeatureResult | null) => void
) {
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 2, // WAJIB 2, karena BISINDO banyak pakai dua tangan
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });

  hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      onResults(toFeatureResult(results));
    } else {
      onResults(null);
    }
  });

  return hands;
}

export function startCameraLoop(videoElement: HTMLVideoElement, hands: Hands) {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });
  camera.start();
  return camera;
}