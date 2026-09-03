<script setup lang="ts">
import { ref } from "vue";
import SignGuide from "./components/SignGuide.vue";

// TODO: ganti dengan komponen translate kamera yang sebenarnya
// setelah model hasil training siap (lihat training/ di root repo).
const activeTab = ref<"guide" | "translate">("guide");
</script>

<template>
  <div>
    <h1>Sign Language Translator</h1>

    <nav>
      <button type="button" @click="activeTab = 'guide'">Panduan A-Z</button>
      <button type="button" @click="activeTab = 'translate'">
        Translate
      </button>
    </nav>

    <SignGuide v-if="activeTab === 'guide'" />

    <div v-else>
      <p>
        Fitur translate akan aktif setelah model isyarat selesai dilatih.
        Lihat folder <code>training/</code> untuk proses training model.
      </p>
    </div>
  </div>
</template>