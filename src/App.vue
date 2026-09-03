<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { initHandLandmarker, detectHands } from "./ml/handDetection";
import DataCollector from "./components/DataCollector.vue";

const mode = ref<"translate" | "collect">("collect"); // default buka mode collect dulu

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const status = ref("Memuat model deteksi tangan...");
const detected = ref(false);

let animationId: number;
let stream: MediaStream;

onMounted(async () => {
  if (mode.value !== "translate") return;
  await startTranslateMode();
});

async function startTranslateMode() {
  try {
    await initHandLandmarker();
    status.value = "Meminta akses kamera...";

    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });

    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await new Promise<void>((resolve) => {
        videoRef.value!.onloadedmetadata = () => resolve();
      });
      videoRef.value.play();
    }

    status.value = "Mendeteksi gerakan tangan...";
    renderLoop();
  } catch (err) {
    console.error(err);
    status.value = "Gagal memuat: " + (err as Error).message;
  }
}

function renderLoop() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (video && canvas && video.readyState >= 2) {
    const ctx = canvas.getContext("2d")!;
    const result = detectHands(video, performance.now());

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (result.landmarks && result.landmarks.length > 0) {
      detected.value = true;
      drawLandmarks(ctx, result.landmarks, canvas.width, canvas.height);
      // const features = landmarksToFeatureVector(result);
      // const prediction = predict(features);
    } else {
      detected.value = false;
    }
  }
  animationId = requestAnimationFrame(renderLoop);
}

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  handsLandmarks: any[],
  width: number,
  height: number
) {
  ctx.fillStyle = "#00e5ff";
  handsLandmarks.forEach((hand) => {
    hand.forEach((point: any) => {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
}

function switchMode(newMode: "translate" | "collect") {
  // stop kamera mode translate kalau lagi aktif, sebelum pindah mode
  if (mode.value === "translate") {
    cancelAnimationFrame(animationId);
    stream?.getTracks().forEach((t) => t.stop());
  }

  mode.value = newMode;

  if (newMode === "translate") {
    status.value = "Memuat model deteksi tangan...";
    startTranslateMode();
  }
}

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  stream?.getTracks().forEach((track) => track.stop());
});
</script>

<template>
  <div class="mode-switch">
    <button :class="{ active: mode === 'translate' }" @click="switchMode('translate')">
      Translate
    </button>
    <button :class="{ active: mode === 'collect' }" @click="switchMode('collect')">
      Collect Data
    </button>
  </div>

  <DataCollector v-if="mode === 'collect'" />

  <div v-else class="app">
    <h1>Sign Language Translator</h1>
    <p class="status">{{ status }}</p>

    <div class="camera-wrapper">
      <video ref="videoRef" style="display: none" playsinline></video>
      <canvas ref="canvasRef" class="camera-canvas"></canvas>
    </div>

    <div class="indicator" :class="{ active: detected }">
      {{ detected ? "Tangan terdeteksi ✋" : "Belum ada tangan terdeteksi" }}
    </div>

    <div class="translation-box">
      <p class="label">Hasil terjemahan:</p>
      <p class="output">(model klasifikasi belum terpasang)</p>
    </div>
  </div>
</template>

<style scoped>
.mode-switch {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0;
}

.mode-switch button {
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #94a3b8;
  cursor: pointer;
}

.mode-switch button.active {
  background: #00e5ff;
  color: #0f172a;
  font-weight: 600;
  border-color: #00e5ff;
}

.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem;
  text-align: center;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.status {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.camera-wrapper {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
}

.camera-canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.indicator {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  background: #1e293b;
  color: #94a3b8;
  display: inline-block;
  font-size: 0.9rem;
}

.indicator.active {
  background: rgba(0, 229, 255, 0.15);
  color: #00e5ff;
}

.translation-box {
  margin-top: 1.5rem;
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
}

.translation-box .label {
  color: #94a3b8;
  font-size: 0.85rem;
  margin: 0 0 0.5rem;
}

.translation-box .output {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}
</style>