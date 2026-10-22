<script setup>
import { formatDate, formatMinutes } from '@/core/format/formatters.js';
import { MISSION_LABELS } from '@/shared/domain/mission-types.js';
import { MISSION_STATUS_LABELS } from '../domain/mission.model.js';

defineProps({ missions: { type: Array, required: true } });
</script>

<template>
  <p v-if="missions.length === 0" class="empty">Belum ada misi yang diselesaikan.</p>
  <ul v-else class="history">
    <li v-for="mission in missions" :key="mission.id">
      <div>
        <p class="subject">{{ mission.subject }}</p>
        <p class="meta">
          {{ MISSION_LABELS[mission.mission_type] }} · {{ formatMinutes(mission.duration_minutes) }} · skor {{ mission.score }} · {{ formatDate(mission.completed_at) }}
        </p>
        <p v-if="mission.transaction_title" class="meta wish">Untuk: {{ mission.transaction_title }}</p>
      </div>
      <span class="chip" :class="mission.status === 'selesai' ? 'chip-unlocked' : 'chip-cancelled'">{{ MISSION_STATUS_LABELS[mission.status] }}</span>
    </li>
  </ul>
</template>

<style scoped>
.history { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
.history li { display: flex; justify-content: space-between; gap: 0.75rem; align-items: flex-start; padding-bottom: 0.6rem; border-bottom: 1px solid var(--line); }
.history li:last-child { border-bottom: 0; padding-bottom: 0; }
.subject { font-weight: 600; }
.meta { font-size: 0.82rem; color: var(--ink-soft); }
.wish { color: var(--brass-ink); }
.empty { color: var(--ink-soft); }
</style>
