<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { formatRupiah } from '@/core/format/formatters.js';
import PadlockMark from '@/shared/components/PadlockMark.vue';
import BaseModal from '@/shared/components/BaseModal.vue';

defineProps({ transaction: { type: Object, required: true } });
const emit = defineEmits(['close']);

const router = useRouter();
const open = ref(false);

onMounted(() => setTimeout(() => { open.value = true; }, 250));

const viewTransactions = () => {
  emit('close');
  router.push('/transaksi');
};
</script>

<template>
  <BaseModal title="Gembok terbuka" @close="emit('close')">
    <div class="celebrate">
      <PadlockMark :open="open" :size="96" />
      <h3>{{ transaction.title }}</h3>
      <p class="amount num">{{ formatRupiah(transaction.amount) }}</p>
      <p class="text">Kamu sudah menuntaskan misi belajar. Keinginan ini kini resmi tercatat sebagai pengeluaran.</p>
      <div class="actions">
        <button type="button" class="btn btn-primary" @click="viewTransactions">Lihat transaksi</button>
        <button type="button" class="btn" @click="emit('close')">Tutup</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.celebrate { display: grid; justify-items: center; gap: 0.5rem; text-align: center; }
h3 { font-size: 1.5rem; }
.amount { font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; color: var(--moss); }
.text { color: var(--ink-soft); max-width: 22rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin-top: 0.75rem; }
</style>
