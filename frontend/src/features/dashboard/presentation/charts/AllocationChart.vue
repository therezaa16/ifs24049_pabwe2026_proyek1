<script setup>
import { computed, ref } from 'vue';
import { formatRupiah } from '@/core/format/formatters.js';
import { hasChartData } from '../../domain/dashboard.model.js';
import { baseChartOptions, cssColor, useChart } from './useChart.js';

const props = defineProps({ allocation: { type: Object, required: true } });
const canvas = ref(null);
const hasData = computed(() => hasChartData(props.allocation.data));

useChart(canvas, () => ({
  type: 'doughnut',
  data: {
    labels: props.allocation.labels,
    datasets: [{
      data: props.allocation.data,
      backgroundColor: [cssColor('--cobalt'), cssColor('--moss'), cssColor('--brass'), cssColor('--slate')],
      borderColor: cssColor('--surface'),
      borderWidth: 3
    }]
  },
  options: {
    ...baseChartOptions(),
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
      tooltip: { callbacks: { label: (context) => ` ${context.label}: ${formatRupiah(context.parsed)}` } }
    }
  }
}));
</script>

<template>
  <div class="chart-box">
    <canvas v-show="hasData" ref="canvas" role="img" aria-label="Diagram alokasi: kebutuhan, keinginan terbuka, terkunci, dan dibatalkan"></canvas>
    <p v-if="!hasData" class="none">Belum ada pengeluaran atau keinginan untuk ditampilkan.</p>
  </div>
</template>

<style scoped>
.chart-box { position: relative; height: 18rem; display: grid; }
.none { align-self: center; text-align: center; color: var(--ink-soft); }
</style>
