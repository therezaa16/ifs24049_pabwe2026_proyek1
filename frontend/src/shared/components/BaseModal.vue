<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';

defineProps({
  title: { type: String, required: true },
  wide: { type: Boolean, default: false }
});
const emit = defineEmits(['close']);

const dialog = ref(null);
const previouslyFocused = document.activeElement;

const onKeydown = (event) => {
  if (event.key === 'Escape') emit('close');
};

onMounted(async () => {
  document.addEventListener('keydown', onKeydown);
  await nextTick();
  dialog.value?.focus();
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  previouslyFocused?.focus?.();
});
</script>

<template>
  <div class="backdrop" @mousedown.self="emit('close')">
    <section
      ref="dialog"
      class="dialog"
      :class="{ 'dialog-wide': wide }"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      tabindex="-1"
    >
      <header class="dialog-head">
        <h2>{{ title }}</h2>
        <button type="button" class="btn btn-quiet btn-small" aria-label="Tutup" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </header>
      <div class="dialog-body"><slot /></div>
    </section>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(6px);
}
.dialog {
  width: min(30rem, 100%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, #fff 100%);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-elevated);
  animation: dialog-in 0.25s ease-out;
}
.dialog-wide { width: min(38rem, 100%); }
.dialog:focus { outline: none; }
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid var(--line);
}
.dialog-head h2 { font-size: 1.25rem; font-weight: 800; }
.dialog-body { padding: 1.4rem; }

@keyframes dialog-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
</style>
