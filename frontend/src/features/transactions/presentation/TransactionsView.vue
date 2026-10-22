<script setup>
import { computed, onMounted, ref } from 'vue';
import { formatRupiah } from '@/core/format/formatters.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import EmptyState from '@/shared/components/EmptyState.vue';
import PadlockMark from '@/shared/components/PadlockMark.vue';
import { useToast } from '@/shared/composables/useToast.js';
import { useTransactionsStore } from '../application/transactions.store.js';
import { STATUS_LABELS, TRANSACTION_STATUSES, TRANSACTION_TYPES, TYPE_LABELS } from '../domain/transaction.model.js';
import TransactionFormModal from './TransactionFormModal.vue';
import TransactionRow from './TransactionRow.vue';

const store = useTransactionsStore();
const toast = useToast();

const showForm = ref(false);
const pendingDelete = ref(null);
const loadError = ref('');

const typeFilters = [{ value: '', label: 'Semua' }, ...Object.values(TRANSACTION_TYPES).map((value) => ({ value, label: TYPE_LABELS[value] }))];
const statusFilters = [{ value: '', label: 'Semua status' }, ...Object.values(TRANSACTION_STATUSES).map((value) => ({ value, label: STATUS_LABELS[value] }))];

const lockedTotal = computed(() => store.lockedWishes.reduce((sum, item) => sum + Number(item.amount), 0));

const load = async () => {
  loadError.value = '';
  try {
    await store.fetchAll();
  } catch (error) {
    loadError.value = error.message;
  }
};

const cancelWish = async (transaction) => {
  try {
    const data = await store.cancel(transaction.id);
    toast.success(data.message);
  } catch (error) {
    toast.error(error.message);
  }
};

const confirmDelete = async () => {
  const target = pendingDelete.value;
  pendingDelete.value = null;
  try {
    await store.remove(target.id);
    toast.success('Transaksi dihapus');
  } catch (error) {
    toast.error(error.message);
  }
};

onMounted(load);
</script>

<template>
  <section>
    <header class="head">
      <div>
        <h1>Transaksi</h1>
        <p class="sub">Pemasukan dan kebutuhan langsung berlaku. Keinginan menunggu misi belajar.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showForm = true"><AppIcon name="plus" /> Catat transaksi</button>
    </header>

    <div v-if="store.lockedWishes.length" class="vault" role="status">
      <PadlockMark :size="40" />
      <p>
        <strong class="num">{{ store.lockedWishes.length }} keinginan terkunci</strong> senilai
        <strong class="num">{{ formatRupiah(lockedTotal) }}</strong> menunggu misi belajar.
      </p>
    </div>

    <div class="filters">
      <div class="chips" role="group" aria-label="Filter jenis">
        <button
          v-for="filter in typeFilters"
          :key="filter.value"
          type="button"
          class="chip-btn"
          :class="{ on: store.filters.type === filter.value }"
          :aria-pressed="store.filters.type === filter.value"
          @click="store.setFilters({ type: filter.value })"
        >{{ filter.label }}</button>
      </div>
      <select class="input status-select" aria-label="Filter status" :value="store.filters.status" @change="store.setFilters({ status: $event.target.value })">
        <option v-for="filter in statusFilters" :key="filter.value" :value="filter.value">{{ filter.label }}</option>
      </select>
    </div>

    <p v-if="loadError" class="load-error" role="alert">
      {{ loadError }} <button type="button" class="btn btn-small" @click="load">Coba lagi</button>
    </p>
    <p v-else-if="store.loading && !store.loaded" class="loading">Memuat transaksi…</p>

    <ul v-else-if="store.filteredItems.length" class="list">
      <TransactionRow
        v-for="item in store.filteredItems"
        :key="item.id"
        :transaction="item"
        @cancel="cancelWish"
        @remove="pendingDelete = $event"
      />
    </ul>

    <EmptyState
      v-else
      :title="store.items.length ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'"
      :message="store.items.length ? 'Ubah filter untuk melihat transaksi lainnya.' : 'Catat pemasukan pertamamu, atau coba tambahkan sebuah keinginan dan rasakan gemboknya.'"
    >
      <button v-if="!store.items.length" type="button" class="btn btn-primary" @click="showForm = true">Catat transaksi</button>
    </EmptyState>

    <TransactionFormModal v-if="showForm" @close="showForm = false" />

    <BaseModal v-if="pendingDelete" title="Hapus transaksi?" @close="pendingDelete = null">
      <p class="confirm">“{{ pendingDelete.title }}” akan dihapus permanen dari catatanmu.</p>
      <div class="foot">
        <button type="button" class="btn" @click="pendingDelete = null">Batal</button>
        <button type="button" class="btn btn-danger" @click="confirmDelete">Hapus</button>
      </div>
    </BaseModal>
  </section>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; justify-content: space-between; margin-bottom: 1.25rem; }
h1 { font-size: 2rem; }
.sub { color: var(--ink-soft); margin-top: 0.25rem; }
.vault { display: flex; align-items: center; gap: 0.9rem; padding: 0.8rem 1rem; margin-bottom: 1.25rem; background: var(--brass-wash); border: 1.5px solid var(--ink); border-radius: var(--radius-s); color: var(--brass-ink); }
.filters { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; margin-bottom: 1rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip-btn { padding: 0.35rem 0.9rem; border: 1.5px solid var(--ink); border-radius: 999px; background: var(--surface); font-weight: 600; }
.chip-btn.on { background: var(--ink); color: #fff; }
.status-select { width: auto; min-width: 11rem; }
.list { list-style: none; display: grid; gap: 0.6rem; margin: 0; padding: 0; }
.loading, .load-error { padding: 1.5rem; text-align: center; color: var(--ink-soft); }
.load-error { color: var(--rose); }
.confirm { margin-bottom: 1.25rem; }
.foot { display: flex; justify-content: flex-end; gap: 0.6rem; }
</style>
