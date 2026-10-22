<script setup>
import { useToast } from '../composables/useToast.js';

const { items, dismiss } = useToast();
</script>

<template>
  <div class="toast-host" role="region" aria-label="Notifikasi" aria-live="polite">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="toast"
      :class="`toast-${item.tone}`"
      @click="dismiss(item.id)"
    >
      {{ item.message }}
    </button>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  right: 1rem;
  bottom: 5rem;
  z-index: 60;
  display: grid;
  gap: 0.5rem;
  max-width: min(24rem, calc(100vw - 2rem));
}
.toast {
  text-align: left;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--ink);
  border-left-width: 6px;
  border-radius: var(--radius-s);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  font-weight: 500;
  animation: toast-in 0.25s ease-out;
}
.toast-success { border-left-color: var(--moss); }
.toast-error { border-left-color: var(--rose); }
.toast-info { border-left-color: var(--cobalt); }

@keyframes toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

@media (min-width: 56rem) {
  .toast-host { bottom: 1.5rem; }
}
</style>
