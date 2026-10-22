import { onBeforeUnmount, ref } from 'vue';

const TICK_MS = 250;

/** Hitung mundur berbasis jam sistem agar tetap akurat meski tab di-throttle browser. */
export const useCountdown = () => {
  const remaining = ref(0);
  let endAt = 0;
  let timer = null;

  const stop = () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };

  const tick = () => {
    remaining.value = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (remaining.value === 0) stop();
  };

  const start = (seconds) => {
    stop();
    endAt = Date.now() + seconds * 1000;
    remaining.value = seconds;
    timer = setInterval(tick, TICK_MS);
  };

  onBeforeUnmount(stop);

  return { remaining, start, stop };
};
