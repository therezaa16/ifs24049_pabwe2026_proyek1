<script setup>
import { ref } from 'vue';
import { formatCompactRupiah, formatDateKey, formatRupiah } from '@/core/format/formatters.js';
import { baseChartOptions, cssColor, useChart } from './useChart.js';

const props = defineProps({ trends: { type: Object, required: true } });
const canvas = ref(null);

useChart(canvas, () => ({
  type: 'bar',
  data: {
    labels: props.trends.dates.map(formatDateKey),
    datasets: [
      {
        type: 'bar',
        label: 'Pengeluaran berlaku',
        data: props.trends.expenses,
        backgroundColor: cssColor('--cobalt'),
        borderRadius: 3,
        yAxisID: 'y',
        order: 2
      },
      {
        type: 'line',
        label: 'Menit belajar',
        data: props.trends.studyMinutes,
        borderColor: cssColor('--brass'),
        backgroundColor: cssColor('--brass'),
        pointRadius: 4,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1
      }
    ]
  },
  options: {
    ...baseChartOptions(),
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
      tooltip: {
        callbacks: {
          label: (context) => context.dataset.yAxisID === 'y1'
            ? ` ${context.dataset.label}: ${context.parsed.y} menit`
            : ` ${context.dataset.label}: ${formatRupiah(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (value) => formatCompactRupiah(value) }, grid: { color: cssColor('--line') } },
      y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: (value) => `${value}m` } },
      x: { grid: { display: false } }
    }
  }
}));
</script>

<template>
  <div class="chart-box">
    <canvas ref="canvas" role="img" aria-label="Grafik pengeluaran harian dan menit belajar selama tujuh hari terakhir"></canvas>
  </div>
</template>

<style scoped>
.chart-box { position: relative; height: 18rem; }
</style>
