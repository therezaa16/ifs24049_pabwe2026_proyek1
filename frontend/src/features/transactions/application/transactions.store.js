import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { transactionsApi } from '../infrastructure/transactions.api.js';
import { filterTransactions, isLockedWish } from '../domain/transaction.model.js';

export const useTransactionsStore = defineStore('transactions', () => {
  const items = ref([]);
  const loading = ref(false);
  const loaded = ref(false);
  const filters = ref({ type: '', status: '' });

  const filteredItems = computed(() => filterTransactions(items.value, filters.value));
  const lockedWishes = computed(() => items.value.filter(isLockedWish));

  const fetchAll = async () => {
    loading.value = true;
    try {
      items.value = (await transactionsApi.list()).transactions;
      loaded.value = true;
    } finally {
      loading.value = false;
    }
  };

  const create = async (form) => {
    const data = await transactionsApi.create(form);
    items.value = [data.transaction, ...items.value];
    return data;
  };

  const replaceItem = (updated) => {
    items.value = items.value.map((item) => (item.id === updated.id ? updated : item));
  };

  const cancel = async (id) => {
    const data = await transactionsApi.cancel(id);
    replaceItem(data.transaction);
    return data;
  };

  const remove = async (id) => {
    await transactionsApi.remove(id);
    items.value = items.value.filter((item) => item.id !== id);
  };

  const setFilters = (next) => {
    filters.value = { ...filters.value, ...next };
  };

  const reset = () => {
    items.value = [];
    loaded.value = false;
    filters.value = { type: '', status: '' };
  };

  return { items, loading, loaded, filters, filteredItems, lockedWishes, fetchAll, create, cancel, remove, replaceItem, setFilters, reset };
});
