<script setup lang="ts">
import type { SignEntry } from "../data/alphabetGuide";

defineProps<{
  entry: SignEntry;
}>();

const emit = defineEmits<{
  select: [entry: SignEntry];
}>();
</script>

<template>
  <button type="button" @click="emit('select', entry)">
    <img
      v-if="entry.image"
      :src="entry.image"
      :alt="`Isyarat huruf ${entry.letter}`"
      @error="($event.target as HTMLImageElement).style.display = 'none'"
    />
    <span>{{ entry.letter }}</span>
  </button>
</template>