<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { initHandLandmarker, detectHands, landmarksToFeatureVector } from "../ml/handDetection";
import { addSample, getCounts, getTotalCount, exportToCSV, clearSamples } from "../ml/dataCollector";

// Huruf BISINDO statis saja (J dan Z butuh gerakan, di-skip dulu di tahap ini)
const LETTERS = "ABCDEFGHIKLMNOPQRSTUVWXY".split("");

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedLetter = ref("A");
const status = ref("Memuat...");
const counts = ref<Record<string, number>>({});
const total = ref(0);
const lastFeatures = ref<number[] | null>(null);

let animationId: number;
let stream: MediaStream;

onMounted(async () => {
  await initHandLandmarker();
  stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  if (videoRef.value) {
    videoRef.value.srcObject = stream;
    await new Promise<void>((resolve) => {
      videoRef.value!.onloadedmetadata = () => resolve();
    });
    videoRef.value.play();
  }
  status.value = "Siap merekam";
  loop();
});

function loop() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (video && canvas && video.readyState >= 2) {
    const ctx = canvas.getContext("2d")!;
    const result = detectHands(video, performance.now());
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (result.landmarks.length > 0) {
      lastFeatures.value = landmarksToFeatureVector(result);

      // gambar titik untuk SEMUA tangan yang kedeteksi (bisa 1 atau 2)
      ctx.fillStyle = "#00e5ff";
      result.landmarks.forEach((hand) => {
        hand.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    } else {
      lastFeatures.value = null;
    }
  }
  animationId = requestAnimationFrame(loop);
}

function capture() {
  if (!lastFeatures.value) {
    alert("Tangan belum terdeteksi, coba posisikan ulang.");
    return;
  }
  addSample(selectedLetter.value, lastFeatures.value);
  counts.value = getCounts();
  total.value = getTotalCount();
}

function handleExport() {
  if (total.value === 0) {
    alert("Belum ada data yang direkam.");
    return;
  }
  exportToCSV();
}

function handleReset() {
  if (confirm("Hapus semua data yang sudah direkam?")) {
    clearSamples();
    counts.value = {};
    total.value = 0;
  }
}

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  stream?.getTracks().forEach((t) => t.stop());
});
</script>

<template>
  <div class="collector">
    <h2>Kumpulkan Dataset — {{ status }}</h2>

    <div class="camera-wrapper">
      <video ref="videoRef" style="display: none" playsinline></video>
      <canvas ref="canvasRef" class="camera-canvas"></canvas>
    </div>

    <div class="letter-picker">
      <button
        v-for="letter in LETTERS"
        :key="letter"
        :class="{ active: selectedLetter === letter }"
        @click="selectedLetter = letter"
      >
        {{ letter }}
      </button>
    </div>

    <p>Huruf dipilih: <strong>{{ selectedLetter }}</strong> — sudah {{ counts[selectedLetter] ?? 0 }} sample</p>

    <button class="capture-btn" @click="capture">📸 Capture</button>

    <p>Total semua sample: {{ total }}</p>

    <div class="actions">
      <button @click="handleExport">⬇️ Export CSV</button>
      <button @click="handleReset">🗑️ Reset</button>
    </div>

    <p class="hint">
      Setelah export, taruh file <code>my_dataset.csv</code> di folder
      <code>training/</code>, lalu jalankan
      <code>python train_model.py --data my_dataset.csv</code>
    </p>
  </div>
</template>

<style scoped>
.collector { max-width: 720px; margin: 0 auto; padding: 1rem; text-align: center; }
.camera-wrapper { aspect-ratio: 4/3; background: #1e293b; border-radius: 12px; overflow: hidden; }
.camera-canvas { width: 100%; height: 100%; object-fit: cover; }
.letter-picker { display: flex; flex-wrap: wrap; gap: 0.25rem; justify-content: center; margin: 1rem 0; }
.letter-picker button { width: 36px; height: 36px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; cursor: pointer; }
.letter-picker button.active { background: #00e5ff; color: #0f172a; font-weight: bold; }
.capture-btn { font-size: 1.25rem; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background: #00e5ff; color: #0f172a; cursor: pointer; margin: 1rem 0; }
.actions { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; }
.actions button { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; cursor: pointer; }
.hint { margin-top: 1.5rem; font-size: 0.8rem; color: #94a3b8; }
</style>