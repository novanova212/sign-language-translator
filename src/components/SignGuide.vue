<script setup lang="ts">
import { ref } from "vue";
import { alphabetGuide, type SignEntry } from "../data/alphabetGuide";
import SignCard from "./SignCard.vue";

const selected = ref<SignEntry | null>(null);

function handleSelect(entry: SignEntry) {
  selected.value = entry;
}

function closeDetail() {
  selected.value = null;
}
</script>

<template>
  <div>
    <h2>Panduan Isyarat A-Z</h2>
    <p>
      Belum hafal bahasa isyarat? Lihat dulu referensi tiap huruf di bawah
      ini, lalu coba praktikkan di depan kamera.
    </p>

    <div>
      <SignCard
        v-for="entry in alphabetGuide"
        :key="entry.letter"
        :entry="entry"
        @select="handleSelect"
      />
    </div>

    <!-- Detail huruf terpilih -->
    <div v-if="selected" role="dialog" aria-modal="true">
      <button type="button" @click="closeDetail">Tutup</button>
      <h3>Huruf {{ selected.letter }}</h3>
      <img
        v-if="selected.image"
        :src="selected.image"
        :alt="`Isyarat huruf ${selected.letter}`"
      />
      <p v-if="selected.tips">{{ selected.tips }}</p>
      <p v-else>Deskripsi belum diisi untuk huruf ini.</p>
    </div>
  </div>
</template>