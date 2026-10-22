import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dashboardApi } from '../infrastructure/dashboard.api.js';

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref(null);
  const loading = ref(false);

  const fetchSummary = async () => {
    loading.value = true;
    try {
      data.value = (await dashboardApi.summary()).data;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    data.value = null;
  };

  return { data, loading, fetchSummary, reset };
});
