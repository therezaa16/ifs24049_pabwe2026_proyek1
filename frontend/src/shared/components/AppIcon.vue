<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 20 }
});

const PATHS = {
  grid: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  timer: 'M12 8v4l3 2M9 2h6M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  plus: 'M12 5v14M5 12h14',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z',
  unlock: 'M7 11V8a5 5 0 0 1 9.5-2M6 11h12v10H6z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  close: 'M6 6l12 12M18 6L6 18',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  check: 'M5 12.5l4.5 4.5L19 7',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  play: 'M7 4l13 8-13 8z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  arrow: 'M5 12h14M13 6l6 6-6 6'
};
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="PATHS[name]" />
  </svg>
</template>
