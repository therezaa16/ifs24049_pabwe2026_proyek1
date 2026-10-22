<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { formatRupiah } from '@/core/format/formatters.js';
import { MISSION_LABELS, MISSION_TYPES } from '@/shared/domain/mission-types.js';
import { useToast } from '@/shared/composables/useToast.js';
import { useTransactionsStore } from '@/features/transactions/application/transactions.store.js';
import { useMissionsStore } from '../application/missions.store.js';
import { wishesForMission } from '../domain/mission.model.js';
import ActiveRecallPanel from './ActiveRecallPanel.vue';
import MissionHistory from './MissionHistory.vue';
import PomodoroPanel from './PomodoroPanel.vue';
import UnlockCelebration from './UnlockCelebration.vue';

const route = useRoute();
const missions = useMissionsStore();
const transactions = useTransactionsStore();
const toast = useToast();

const activeType = ref(MISSION_TYPES.POMODORO);
const selectedWishId = ref('');
const unlocked = ref(null);
const loadError = ref('');
const panelKey = ref(0);

const missionTypes = Object.values(MISSION_TYPES);
const availableWishes = computed(() => wishesForMission(transactions.lockedWishes, activeType.value));
const selectedWish = computed(() => availableWishes.value.find((wish) => String(wish.id) === String(selectedWishId.value)) ?? null);

const selectType = (type) => {
  activeType.value = type;
  selectedWishId.value = '';
  panelKey.value += 1;
};

const applyWishFromRoute = () => {
  const wish = transactions.lockedWishes.find((item) => String(item.id) === String(route.query.wish));
  if (!wish) return;
  activeType.value = wish.mission_type;
  selectedWishId.value = String(wish.id);
};

const load = async () => {
  loadError.value = '';
  try {
    await Promise.all([missions.load(), transactions.fetchAll()]);
    applyWishFromRoute();
  } catch (error) {
    loadError.value = error.message;
  }
};

const onCompleted = (result) => {
  panelKey.value += 1;
  selectedWishId.value = '';
  if (result.unlockedTransaction) {
    transactions.replaceItem(result.unlockedTransaction);
    unlocked.value = result.unlockedTransaction;
  } else if (result.passed) {
    toast.success(result.message);
  } else {
    toast.info(result.message);
  }
};

watch(selectedWishId, () => { panelKey.value += 1; });
onMounted(load);
</script>

<template>
  <section>
    <header class="head">
      <h1>Misi Belajar</h1>
      <p class="sub">Selesaikan misi untuk membuka gembok keinginanmu. Waktu belajar diverifikasi oleh server.</p>
    </header>

    <p v-if="loadError" class="load-error" role="alert">{{ loadError }} <button type="button" class="btn btn-small" @click="load">Coba lagi</button></p>
    <p v-else-if="!missions.ready" class="loading">Memuat misi…</p>

    <div v-else class="layout">
      <div class="panel workbench">
        <div class="tabs" role="tablist" aria-label="Jenis misi">
          <button
            v-for="type in missionTypes"
            :key="type"
            type="button"
            role="tab"
            class="tab"
            :class="{ on: activeType === type }"
            :aria-selected="activeType === type"
            @click="selectType(type)"
          >{{ MISSION_LABELS[type] }}</button>
        </div>

        <div class="field">
          <label for="wish">Keinginan yang ingin dibuka</label>
          <select id="wish" v-model="selectedWishId" class="input">
            <option value="">Belajar bebas (tanpa membuka keinginan)</option>
            <option v-for="wish in availableWishes" :key="wish.id" :value="String(wish.id)">
              {{ wish.title }} · {{ formatRupiah(wish.amount) }}
            </option>
          </select>
          <span v-if="availableWishes.length === 0" class="field-hint">
            Tidak ada keinginan terkunci dengan misi {{ MISSION_LABELS[activeType] }}.
          </span>
        </div>

        <PomodoroPanel v-if="activeType === MISSION_TYPES.POMODORO" :key="`p-${panelKey}`" :wish="selectedWish" :subject-suggestion="selectedWish ? selectedWish.category : ''" @completed="onCompleted" />
        <ActiveRecallPanel v-else :key="`a-${panelKey}`" :wish="selectedWish" @completed="onCompleted" />
      </div>

      <aside class="panel">
        <h2 class="panel-title">Riwayat misi</h2>
        <p class="panel-hint">Sesi yang sudah selesai atau gagal.</p>
        <MissionHistory :missions="missions.history" />
      </aside>
    </div>

    <UnlockCelebration v-if="unlocked" :transaction="unlocked" @close="unlocked = null" />
  </section>
</template>

<style scoped>
.head { margin-bottom: 1.25rem; }
h1 { font-size: 2rem; }
.sub { color: var(--ink-soft); margin-top: 0.25rem; max-width: 40rem; }
.layout { display: grid; gap: 1.25rem; align-items: start; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 1.25rem; border: 1.5px solid var(--ink); border-radius: var(--radius-s); overflow: hidden; }
.tab { padding: 0.65rem; border: 0; border-right: 1.5px solid var(--ink); background: var(--surface); font-weight: 700; }
.tab:last-child { border-right: 0; }
.tab.on { background: var(--ink); color: #fff; }
.loading, .load-error { padding: 1.5rem; text-align: center; color: var(--ink-soft); }
.load-error { color: var(--rose); }
@media (min-width: 64rem) { .layout { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); } }
</style>
