<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { formatDate, formatRupiah } from '@/core/format/formatters.js';
import { MISSION_LABELS } from '@/shared/domain/mission-types.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import {
  STATUS_LABELS, STATUS_TONES, TYPE_LABELS, isLockedWish, presentAmount
} from '../domain/transaction.model.js';

const props = defineProps({ transaction: { type: Object, required: true } });
defineEmits(['cancel', 'remove']);

const amount = computed(() => presentAmount(props.transaction));
const locked = computed(() => isLockedWish(props.transaction));
const tone = computed(() => STATUS_TONES[props.transaction.status]);
</script>

<template>
  <li class="row" :class="[`row-${tone}`, { 'row-hatched': locked }]">
    <div class="main">
      <p class="title">
        <AppIcon v-if="locked" name="lock" :size="16" class="title-lock" />
        <span :class="{ struck: amount.tone === 'muted' }">{{ transaction.title }}</span>
      </p>
      <p class="meta">
        {{ TYPE_LABELS[transaction.type] }} · {{ transaction.category }} · {{ formatDate(transaction.created_at) }}
        <template v-if="transaction.type === 'keinginan' && transaction.mission_type">
          · Misi {{ MISSION_LABELS[transaction.mission_type] }}
        </template>
      </p>
      <p v-if="transaction.note" class="note">{{ transaction.note }}</p>
    </div>

    <p class="amount num" :class="`amount-${amount.tone}`">{{ amount.prefix }}{{ formatRupiah(transaction.amount) }}</p>

    <span class="chip" :class="`chip-${tone}`">{{ STATUS_LABELS[transaction.status] }}</span>

    <div class="actions">
      <RouterLink v-if="locked" class="btn btn-brass btn-small" :to="{ path: '/misi', query: { wish: transaction.id } }">
        <AppIcon name="unlock" :size="16" /> Buka lewat misi
      </RouterLink>
      <button v-if="locked" type="button" class="btn btn-small" @click="$emit('cancel', transaction)">Batalkan</button>
      <button type="button" class="btn btn-quiet btn-small btn-danger" :aria-label="`Hapus ${transaction.title}`" @click="$emit('remove', transaction)">
        <AppIcon name="trash" :size="16" />
      </button>
    </div>
  </li>
</template>

<style scoped>
.row {
  --rail: var(--cobalt);
  display: grid;
  gap: 0.5rem 1rem;
  align-items: center;
  padding: 0.9rem 1rem 0.9rem 1.2rem;
  background: var(--surface);
  border: 1.5px solid var(--ink);
  border-left: 8px solid var(--rail);
  border-radius: var(--radius-s);
}
.row-locked { --rail: var(--brass); }
.row-unlocked { --rail: var(--moss); }
.row-cancelled { --rail: var(--slate); }
.row-hatched {
  background-image: repeating-linear-gradient(135deg, transparent 0 10px, rgba(201, 138, 20, 0.1) 10px 20px);
}
.title { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
.title-lock { color: var(--brass-ink); flex: none; }
.struck { text-decoration: line-through; color: var(--ink-faint); }
.meta { font-size: 0.85rem; color: var(--ink-soft); }
.note { font-size: 0.85rem; color: var(--ink-faint); font-style: italic; }
.amount { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; }
.amount-positive { color: var(--moss); }
.amount-negative { color: var(--ink); }
.amount-pending { color: var(--brass-ink); }
.amount-muted { color: var(--ink-faint); text-decoration: line-through; }
.actions { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-end; }

@media (min-width: 56rem) {
  .row { grid-template-columns: 1fr 9rem 6rem auto; }
  .amount { text-align: right; }
}
</style>
