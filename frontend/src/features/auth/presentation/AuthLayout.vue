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
      <div class="brand-content">
        <div class="brand-head">
          <div class="p-2 rounded-2xl bg-white/10 backdrop-blur">
            <PadlockMark :size="48" />
          </div>
          <div>
            <p class="brand-name">{{ APP_TITLE }}</p>
            <p class="brand-tag">{{ APP_TAGLINE }}</p>
          </div>
        </div>

        <div class="hero">
          <p class="hero-kicker">Belajar. Tahan. Buka dengan bijak.</p>
          <h1 class="hero-title">Bangun disiplin finansial lewat kebiasaan belajar.</h1>
          <p class="hero-text">Keinginan tetap terkunci sampai kamu menuntaskan misi. Hasilnya lebih sadar, lebih terarah, tanpa tekanan.</p>
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
      </div>
    </aside>

    <main class="form-side"><slot /></main>
  </div>
</template>

<style scoped>
.auth-layout { min-height: 100vh; display: grid; }
.brand {
  position: relative;
  background: radial-gradient(circle at top left, #818cf8, #4338ca 55%, #312e81);
  color: #fff;
  overflow: hidden;
}
.brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at bottom right, rgba(165, 180, 252, 0.25), transparent 55%);
}
.brand-content {
  position: relative;
  height: 100%;
  padding: 1.5rem;
  display: grid;
  gap: 2rem;
  align-content: space-between;
}
.brand-head { display: flex; align-items: center; gap: 1rem; }
.brand-name { font-family: var(--font-display); font-weight: 800; font-size: 1.4rem; line-height: 1.05; }
.brand-tag { font-size: 0.95rem; opacity: 0.8; margin-top: 0.2rem; }
.hero { display: grid; gap: 0.8rem; max-width: 28rem; }
.hero-kicker { text-transform: uppercase; letter-spacing: 0.4em; font-size: 0.7rem; opacity: 0.7; }
.hero-title { font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.6rem); line-height: 1.02; }
.hero-text { font-size: 1rem; opacity: 0.85; max-width: 26rem; }
.loop { list-style: none; margin: 0; padding: 0; display: none; gap: 1rem; }
.loop li { display: grid; grid-template-columns: 2.4rem 1fr; gap: 1rem; align-items: start; padding: 1rem 1.2rem; border-radius: 1.2rem; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); }
.loop-no {
  display: grid; place-items: center; width: 2.4rem; height: 2.4rem;
  border-radius: 999px; background: rgba(255, 255, 255, 0.9); color: #312e81; font-weight: 800;
}
.loop h2 { font-size: 1rem; margin-bottom: 0.2rem; }
.loop p { font-size: 0.9rem; opacity: 0.8; }
.form-side { display: grid; place-items: center; padding: 1.5rem; background: radial-gradient(circle at top, rgba(99, 102, 241, 0.05), transparent 60%); }

@media (min-width: 64rem) {
  .auth-layout { grid-template-columns: minmax(24rem, 1fr) minmax(32rem, 1.1fr); }
  .brand-content { padding: 4rem; }
  .loop { display: grid; }
}
</style>
