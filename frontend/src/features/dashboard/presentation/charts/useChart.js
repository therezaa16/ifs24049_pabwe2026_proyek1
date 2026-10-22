import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend,
  LineController, LineElement, LinearScale, PointElement, Tooltip
} from 'chart.js';
import { onBeforeUnmount, onMounted, watch } from 'vue';

Chart.register(
  ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend,
  LineController, LineElement, LinearScale, PointElement, Tooltip
);

export const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const baseChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  font: { family: cssColor('--font-body') }
});

/** Membuat ulang grafik setiap kali konfigurasi (yang bergantung pada data reaktif) berubah. */
export const useChart = (canvasRef, buildConfig) => {
  let chart = null;

  const render = () => {
    chart?.destroy();
    chart = canvasRef.value ? new Chart(canvasRef.value, buildConfig()) : null;
  };

  onMounted(render);
  watch(buildConfig, render);
  onBeforeUnmount(() => chart?.destroy());
};
