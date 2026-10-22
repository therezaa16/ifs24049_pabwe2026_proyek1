<script setup>
import { computed, ref } from 'vue';
import { formatCompactRupiah, formatRupiah } from '@/core/format/formatters.js';
import { hasChartData } from '../../domain/dashboard.model.js';
import { baseChartOptions, cssColor, useChart } from './useChart.js';

const props = defineProps({ categories: { type: Object, required: true } });
const canvas = ref(null);
const hasData = computed(() => hasChartData(props.categories.data));

useChart(canvas, () => ({
  type: 'bar',
  data: {
    labels: props.categories.labels,
    datasets: [{ data: props.categories.data, backgroundColor: cssColor('--ink'), borderRadius: 3 }]
  },
  options: {
    ...baseChartOptions(),
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => ` ${formatRupiah(context.parsed.x)}` } }
    },
    scales: {
      x: { beginAtZero: true, ticks: { callback: (value) => formatCompactRupiah(value) }, grid: { color: cssColor('--line') } },
      y: { grid: { display: false } }
    }
  }
}));
</script>

<template>
  <div class="chart-box">
    <canvas v-show="hasData" ref="canvas" role="img" aria-label="Pengeluaran per kategori bulan ini"></canvas>
    <p v-if="!hasData" class="none">Belum ada pengeluaran bulan ini.</p>
  </div>
</template>

<style scoped>
.chart-box { position: relative; height: 16rem; display: grid; }
.none { align-self: center; text-align: center; color: var(--ink-soft); }
</style>
