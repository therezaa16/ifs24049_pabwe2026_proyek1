<script setup>
import PadlockMark from '@/shared/components/PadlockMark.vue';
import { APP_TAGLINE, APP_TITLE } from '@/core/config/env.js';

const steps = [
  { title: 'Catat keinginan', text: 'Boba, skin game, atau sepatu baru masuk daftar, belum menjadi pengeluaran.' },
  { title: 'Gembok terkunci', text: 'Keinginan menunggu. Uang sakumu tetap aman selama belum dibuka.' },
  { title: 'Selesaikan misi belajar', text: 'Pomodoro atau Active Recall. Waktu belajar diverifikasi server.' },
  { title: 'Gembok terbuka', text: 'Baru setelah itu keinginan resmi dihitung sebagai pengeluaran.' }
];
</script>

<template>
  <div class="auth-layout">
    <aside class="brand">
      <div class="brand-head">
        <PadlockMark :size="44" />
        <div>
          <p class="brand-name">{{ APP_TITLE }}</p>
          <p class="brand-tag">{{ APP_TAGLINE }}</p>
        </div>
      </div>

      <ol class="loop">
        <li v-for="(step, index) in steps" :key="step.title">
          <span class="loop-no num">{{ index + 1 }}</span>
          <div>
            <h2>{{ step.title }}</h2>
            <p>{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </aside>

    <main class="form-side"><slot /></main>
  </div>
</template>

<style scoped>
.auth-layout { min-height: 100vh; display: grid; }
.brand {
  background: var(--cobalt);
  color: #fff;
  padding: 1.5rem;
  display: grid;
  gap: 2rem;
  align-content: start;
}
.brand-head { display: flex; align-items: center; gap: 0.9rem; }
.brand-name { font-family: var(--font-display); font-weight: 800; font-size: 1.35rem; line-height: 1.1; }
.brand-tag { font-size: 0.9rem; opacity: 0.88; margin-top: 0.15rem; }
.loop { list-style: none; margin: 0; padding: 0; display: none; gap: 1.25rem; }
.loop li { display: grid; grid-template-columns: 2.25rem 1fr; gap: 0.9rem; }
.loop-no {
  display: grid; place-items: center; width: 2.25rem; height: 2.25rem;
  border: 2px solid #fff; border-radius: 50%; font-weight: 700;
}
.loop h2 { font-size: 1.05rem; margin-bottom: 0.15rem; }
.loop p { font-size: 0.92rem; opacity: 0.88; max-width: 26rem; }
.form-side { display: grid; place-items: center; padding: 1.5rem; }

@media (min-width: 56rem) {
  .auth-layout { grid-template-columns: minmax(22rem, 5fr) 6fr; }
  .brand { padding: 3rem; align-content: center; gap: 3rem; }
  .loop { display: grid; }
}
</style>
