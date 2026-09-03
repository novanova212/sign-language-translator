<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { createHandDetector, startCameraLoop } from "../ml/handDetection";
import type { HandFeatureResult } from "../ml/handDetection";

const emit = defineEmits<{
  features: [result: HandFeatureResult | null];
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
let cameraInstance: ReturnType<typeof startCameraLoop> | null = null;

onMounted(() => {
  const hands = createHandDetector((result) => {
    emit("features", result);
  });

  if (videoRef.value) {
    cameraInstance = startCameraLoop(videoRef.value, hands);
  }
});

onUnmounted(() => {
  cameraInstance?.stop?.();
});
</script>

<template>
  <video ref="videoRef" autoplay playsinline muted></video>
</template>