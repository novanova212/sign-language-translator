// handDetection.ts
// Pakai @mediapipe/tasks-vision (HandLandmarker) — sesuai package yang
// sudah ter-install di project ini. Tetap melacak DUA tangan sekaligus,
// karena banyak huruf BISINDO butuh dua tangan (beda dari ASL).

import {
  HandLandmarker,
  FilesetResolver,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;

/** Panggil sekali di awal (misal saat komponen mount), sebelum detectHands(). */
export async function initHandLandmarker() {
  if (handLandmarker) return handLandmarker;

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
    numHands: 2, // WAJIB 2, karena BISINDO banyak pakai dua tangan
  });

  return handLandmarker;
}

export interface DetectResult {
  landmarks: NormalizedLandmark[][]; // per tangan, tiap tangan = 21 titik {x,y,z}
  handedness: { label: "Left" | "Right"; score: number }[]; // per tangan
}

/** Panggil tiap frame video. Butuh initHandLandmarker() sudah selesai duluan. */
export function detectHands(
  video: HTMLVideoElement,
  timestampMs: number
): DetectResult {
  if (!handLandmarker) {
    return { landmarks: [], handedness: [] };
  }

  const result = handLandmarker.detectForVideo(video, timestampMs);
  const handedness = result.handednesses.map((h) => ({
    label: h[0].categoryName as "Left" | "Right",
    score: h[0].score,
  }));

  return { landmarks: result.landmarks, handedness };
}

const EMPTY_COORDS = () => new Array(63).fill(0);

/**
 * Ubah hasil deteksi jadi 128 fitur numerik flat, urutannya HARUS sama
 * persis dengan header CSV yang dipakai training/train_model.py:
 * [right_hand_prob, left_hand_prob, ...right_coords(63), ...left_coords(63)]
 */
export function landmarksToFeatureVector(result: DetectResult): number[] {
  let rightProb = 0;
  let leftProb = 0;
  let rightCoords = EMPTY_COORDS();
  let leftCoords = EMPTY_COORDS();

  result.landmarks.forEach((hand, i) => {
    const handedness = result.handedness[i];
    if (!handedness) return;
    const coords = hand.flatMap((p) => [p.x, p.y, p.z]);

    if (handedness.label === "Right") {
      rightProb = handedness.score;
      rightCoords = coords;
    } else if (handedness.label === "Left") {
      leftProb = handedness.score;
      leftCoords = coords;
    }
  });

  return [rightProb, leftProb, ...rightCoords, ...leftCoords];
}