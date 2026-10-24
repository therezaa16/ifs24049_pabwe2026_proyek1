<script setup>
import { computed, onMounted, ref } from 'vue';
import { formatRupiah } from '@/core/format/formatters.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import ConfirmModal from '@/shared/components/ConfirmModal.vue';
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
const pendingCancel = ref(null);
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

const handleCancelRequest = (transaction) => {
  pendingCancel.value = transaction;
};

const confirmCancel = async () => {
  const target = pendingCancel.value;
  pendingCancel.value = null;
  if (!target) return;
  try {
    const data = await store.cancel(target.id);
    toast.success(data.message);
  } catch (error) {
    toast.error(error.message);
  }
};

const confirmDelete = async () => {
  const target = pendingDelete.value;
  pendingDelete.value = null;
  if (!target) return;
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
  <section class="space-y-6">
    <header class="head flex flex-wrap gap-4 items-end justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Transaksi</h1>
        <p class="sub text-sm text-slate-500 mt-1">Pemasukan dan kebutuhan langsung berlaku. Keinginan menunggu misi belajar.</p>
      </div>
      <button
        type="button"
        class="btn btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-all"
        @click="showForm = true"
      >
        <AppIcon name="plus" :size="18" /> Catat transaksi
      </button>
    </header>

    <!-- Locked Wishes Banner -->
    <div
      v-if="store.lockedWishes.length"
      class="vault flex items-center gap-3.5 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-900 shadow-xs"
      role="status"
    >
      <div class="p-2 bg-amber-100 rounded-xl shrink-0">
        <PadlockMark :size="32" />
      </div>
      <p class="text-sm font-medium leading-relaxed">
        <strong class="num font-bold text-amber-950">{{ store.lockedWishes.length }} keinginan terkunci</strong> senilai
        <strong class="num font-bold text-amber-950">{{ formatRupiah(lockedTotal) }}</strong> menunggu misi belajar untuk dibuka.
      </p>
    </div>

    <!-- Filters Section -->
    <div class="filters flex flex-wrap gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
      <div class="chips flex flex-wrap gap-1.5" role="group" aria-label="Filter jenis">
        <button
          v-for="filter in typeFilters"
          :key="filter.value"
          type="button"
          class="chip-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border"
          :class="store.filters.type === filter.value
            ? 'on bg-slate-900 text-white border-slate-900 shadow-xs'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'"
          :aria-pressed="store.filters.type === filter.value"
          @click="store.setFilters({ type: filter.value })"
        >
          {{ filter.label }}
        </button>
      </div>

      <select
        class="input status-select px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-brand-500"
        aria-label="Filter status"
        :value="store.filters.status"
        @change="store.setFilters({ status: $event.target.value })"
      >
        <option v-for="filter in statusFilters" :key="filter.value" :value="filter.value">{{ filter.label }}</option>
      </select>
    </div>

    <!-- Loading, Error & List States -->
    <p v-if="loadError" class="load-error p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl text-center" role="alert">
      {{ loadError }} <button type="button" class="btn btn-small ml-2 underline font-bold" @click="load">Coba lagi</button>
    </p>
    <div v-else-if="store.loading && !store.loaded" class="loading p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
      <span class="animate-spin text-lg">⏳</span> Memuat data transaksi…
    </div>

    <ul v-else-if="store.filteredItems.length" class="list space-y-2.5">
      <TransactionRow
        v-for="item in store.filteredItems"
        :key="item.id"
        :transaction="item"
        @cancel="handleCancelRequest"
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

    <!-- HCI Error Prevention: Confirmation dialog for deleting transaction -->
    <ConfirmModal
      v-if="pendingDelete"
      title="Hapus transaksi?"
      :message="`“${pendingDelete.title}” senilai ${formatRupiah(pendingDelete.amount)} akan dihapus permanen dari catatan keuanganmu.`"
      confirm-text="Hapus Permanen"
      cancel-text="Batal"
      tone="danger"
      @confirm="confirmDelete"
      @close="pendingDelete = null"
    />

    <!-- HCI Error Prevention: Confirmation dialog for canceling a locked wish -->
    <ConfirmModal
      v-if="pendingCancel"
      title="Batalkan Keinginan?"
      :message="`Batalkan keinginan “${pendingCancel.title}” senilai ${formatRupiah(pendingCancel.amount)}? Dana ini akan diarsipkan sebagai Dana Hemat yang berhasil kamu tahan dari pembelian impulsif.`"
      confirm-text="Ya, Batalkan Keinginan"
      cancel-text="Pertahankan"
      tone="warning"
      @confirm="confirmCancel"
      @close="pendingCancel = null"
    />
  </section>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; justify-content: space-between; margin-bottom: 1.25rem; }
.sub { color: var(--ink-soft); }
.list { list-style: none; margin: 0; padding: 0; }
</style>
