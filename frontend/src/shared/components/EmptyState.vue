<script setup>
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' }
});
</script>

<template>
  <div class="empty">
    <slot name="visual" />
    <h3>{{ title }}</h3>
    <p v-if="message">{{ message }}</p>
    <div class="actions"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  text-align: center;
  border: 1.5px dashed var(--ink-faint);
  border-radius: var(--radius-m);
  background: var(--surface);
}
.empty h3 { font-size: 1.1rem; }
.empty p { max-width: 28rem; color: var(--ink-soft); }
.actions { margin-top: 0.5rem; }
</style>
