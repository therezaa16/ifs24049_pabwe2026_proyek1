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
  <section class="space-y-6">
    <header class="head">
      <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Misi Belajar</h1>
      <p class="sub text-sm text-slate-500 mt-1 max-w-2xl">
        Selesaikan misi untuk membuka gembok keinginanmu. Durasi belajar dan skor kuis diverifikasi langsung oleh server.
      </p>
    </header>

    <p v-if="loadError" class="load-error p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl text-center" role="alert">
      {{ loadError }} <button type="button" class="btn btn-small ml-2 underline font-bold" @click="load">Coba lagi</button>
    </p>
    <div v-else-if="!missions.ready" class="loading p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
      <span class="animate-spin text-xl">⏳</span> Memuat sesi misi…
    </div>

    <div v-else class="layout grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Main Mission Workbench -->
      <div class="panel workbench lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <!-- Tab Selector: Pomodoro vs Active Recall -->
        <div class="tabs grid grid-cols-2 p-1 bg-slate-100 rounded-xl" role="tablist" aria-label="Jenis misi">
          <button
            v-for="type in missionTypes"
            :key="type"
            type="button"
            role="tab"
            class="tab py-2.5 text-xs font-bold rounded-lg transition-all"
            :class="activeType === type ? 'on bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
            :aria-selected="activeType === type"
            @click="selectType(type)"
          >
            {{ MISSION_LABELS[type] }}
          </button>
        </div>

        <!-- Wish Linking Selector -->
        <div class="field space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <label for="wish" class="block text-xs font-bold text-slate-700">Tautkan dengan Keinginan yang Ingin Dibuka:</label>
          <select id="wish" v-model="selectedWishId" class="input w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white outline-none focus:border-brand-500">
            <option value="">Belajar bebas (tanpa membuka keinginan)</option>
            <option v-for="wish in availableWishes" :key="wish.id" :value="String(wish.id)">
              {{ wish.title }} · {{ formatRupiah(wish.amount) }}
            </option>
          </select>
          <span v-if="availableWishes.length === 0" class="field-hint block text-[11px] text-slate-400 italic">
            Tidak ada keinginan terkunci dengan misi {{ MISSION_LABELS[activeType] }}. Kamu tetap bisa belajar secara bebas.
          </span>
        </div>

        <PomodoroPanel
          v-if="activeType === MISSION_TYPES.POMODORO"
          :key="`p-${panelKey}`"
          :wish="selectedWish"
          :subject-suggestion="selectedWish ? selectedWish.category : ''"
          @completed="onCompleted"
        />
        <ActiveRecallPanel
          v-else
          :key="`a-${panelKey}`"
          :wish="selectedWish"
          @completed="onCompleted"
        />
      </div>

      <!-- Mission History Sidebar -->
      <aside class="panel lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div>
          <h2 class="panel-title text-sm font-bold text-slate-800">Riwayat misi belajar</h2>
          <p class="panel-hint text-xs text-slate-400">Sesi yang telah selesai atau gagal dievaluasi server.</p>
        </div>
        <MissionHistory :missions="missions.history" />
      </aside>
    </div>

    <UnlockCelebration v-if="unlocked" :transaction="unlocked" @close="unlocked = null" />
  </section>
</template>

<style scoped>
.head { margin-bottom: 0.5rem; }
.sub { color: var(--ink-soft); }
</style>
