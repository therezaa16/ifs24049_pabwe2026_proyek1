<script setup>
defineProps({
  open: { type: Boolean, default: false },
  size: { type: Number, default: 64 }
});
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" class="padlock" :class="{ 'padlock-open': open }" aria-hidden="true">
    <path class="shackle" d="M20 30V21a12 12 0 0 1 24 0v9" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" />
    <rect x="12" y="30" width="40" height="28" rx="6" fill="var(--brass)" stroke="var(--ink)" stroke-width="2.5" />
    <circle cx="32" cy="42" r="4" fill="var(--ink)" />
    <rect x="30.5" y="44" width="3" height="8" rx="1.5" fill="var(--ink)" />
  </svg>
</template>

<style scoped>
.shackle {
  transform-origin: 44px 30px;
  transition: transform 0.55s cubic-bezier(0.3, 1.4, 0.5, 1);
}
.padlock-open .shackle {
  transform: translateY(-9px) rotate(-28deg);
}
</style>
