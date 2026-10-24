<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { formatDate, formatMinutes, formatRupiah } from '@/core/format/formatters.js';
import { MISSION_LABELS } from '@/shared/domain/mission-types.js';
import AppIcon from '@/shared/components/AppIcon.vue';
import PadlockMark from '@/shared/components/PadlockMark.vue';
import { useAuthStore } from '@/features/auth/application/auth.store.js';
import { STATUS_LABELS, STATUS_TONES } from '@/features/transactions/domain/transaction.model.js';
import { useDashboardStore } from '../application/dashboard.store.js';
import { budgetUsage, disciplineLabel, firstName } from '../domain/dashboard.model.js';
import AllocationChart from './charts/AllocationChart.vue';
import CategoryChart from './charts/CategoryChart.vue';
import WeeklyTrendChart from './charts/WeeklyTrendChart.vue';
import BudgetModal from './BudgetModal.vue';

const dashboard = useDashboardStore();
const auth = useAuthStore();

const loadError = ref('');
const showBudget = ref(false);

const data = computed(() => dashboard.data);
const usage = computed(() => budgetUsage(data.value?.financial));
const ringStyle = computed(() => ({ '--score': `${data.value?.financial?.disciplineScore ?? 0}%` }));

const load = async () => {
  loadError.value = '';
  try {
    await Promise.all([dashboard.fetchSummary(), auth.restoreSession()]);
  } catch (error) {
    loadError.value = error.message;
  }
};

onMounted(load);
</script>

<template>
  <section class="space-y-6">
    <!-- Header with Welcome Greeting -->
    <header class="head flex flex-wrap gap-4 items-end justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xl">🎓</span>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Halo, {{ firstName(auth.user?.name) || 'Mahasiswa' }}!
          </h1>
        </div>
        <p class="sub text-sm text-slate-500 mt-1">
          Pantau saldo aktif, anggaran saku, dan capaian misi belajar Active Recall & Pomodoro.
        </p>
      </div>
      <RouterLink
        class="btn btn-primary px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 hover:shadow-md transition-all shrink-0"
        to="/transaksi"
      >
        <AppIcon name="plus" :size="18" /> Catat transaksi
      </RouterLink>
    </header>

    <!-- Error & Loading States -->
    <p v-if="loadError" class="state error p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl text-center" role="alert">
      {{ loadError }} <button type="button" class="btn btn-small ml-2 underline font-bold" @click="load">Coba lagi</button>
    </p>
    <div v-else-if="!data" class="state p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
      <span class="animate-spin text-xl">⏳</span> Memuat ringkasan dashboard…
    </div>

    <!-- Main Dashboard Content -->
    <template v-else>
      <!-- Locked Wishes Alert Callout -->
      <RouterLink
        v-if="data.financial.counts.wantsLocked"
        class="vault flex items-center justify-between gap-3.5 p-4 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl text-amber-900 shadow-xs hover:border-amber-300 transition-all group"
        to="/misi"
      >
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-amber-100 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
            <PadlockMark :size="32" />
          </div>
          <span class="text-sm font-medium leading-relaxed">
            <strong class="num font-bold text-amber-950">{{ data.financial.counts.wantsLocked }} keinginan terkunci</strong>
            senilai <strong class="num font-bold text-amber-950">{{ formatRupiah(data.financial.totalWantsLocked) }}</strong>. Selesaikan misi belajar untuk membukanya.
          </span>
        </div>
        <span class="p-2 rounded-xl bg-amber-100/70 text-amber-800 group-hover:translate-x-1 transition-transform">
          <AppIcon name="arrow" :size="18" />
        </span>
      </RouterLink>

      <!-- Primary Financial Hero Ledger -->
      <div class="ledger panel bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid md:grid-cols-12 gap-6 items-center">
        <div class="balance md:col-span-5 space-y-1">
          <span class="eyebrow inline-block text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Saldo aktif tersedia</span>
          <p
            class="balance-value num font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-none"
            :class="data.financial.activeBalance < 0 ? 'negative text-rose-600' : 'text-slate-900'"
          >
            {{ formatRupiah(data.financial.activeBalance) }}
          </p>
          <p class="balance-note text-xs text-slate-500 pt-1">
            Pemasukan riil dikurangi pengeluaran yang benar-benar berlaku.
          </p>
        </div>

        <dl class="figures md:col-span-7 grid grid-cols-2 gap-3 sm:gap-4 m-0">
          <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
            <dt class="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Pemasukan
            </dt>
            <dd class="num income font-display font-bold text-base sm:text-lg text-emerald-600 m-0">
              {{ formatRupiah(data.financial.totalIncome) }}
            </dd>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
            <dt class="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span> Pengeluaran berlaku
            </dt>
            <dd class="num font-display font-bold text-base sm:text-lg text-slate-800 m-0">
              {{ formatRupiah(data.financial.totalActiveExpenses) }}
            </dd>
          </div>

          <div class="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-0.5">
            <dt class="text-xs font-medium text-amber-800 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> Dana terkunci
            </dt>
            <dd class="num locked font-display font-bold text-base sm:text-lg text-amber-900 m-0">
              {{ formatRupiah(data.financial.totalWantsLocked) }}
            </dd>
          </div>

          <div class="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-0.5">
            <dt class="text-xs font-medium text-indigo-800 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span> Hemat (dibatalkan)
            </dt>
            <dd class="num saved font-display font-bold text-base sm:text-lg text-indigo-900 m-0">
              {{ formatRupiah(data.financial.totalWantsCancelled) }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Trio Metrics: Anggaran, Skor Disiplin, Waktu Belajar -->
      <div class="trio grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Card 1: Anggaran Bulan Ini -->
        <article class="panel bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div class="inline-head flex justify-between items-center gap-2 mb-2">
              <h2 class="panel-title text-sm font-bold text-slate-800">Anggaran bulan ini</h2>
              <button
                type="button"
                class="btn btn-small px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                @click="showBudget = true"
              >
                Atur
              </button>
            </div>
            <template v-if="usage.hasBudget">
              <p class="big num font-display font-extrabold text-2xl text-slate-900 mt-1">
                {{ formatRupiah(Math.abs(data.financial.remainingBudget)) }}
              </p>
              <p class="panel-hint text-xs text-slate-500 mt-0.5">
                {{ usage.over ? 'melebihi anggaran' : 'sisa anggaran' }} dari {{ formatRupiah(data.financial.monthlyBudget) }}
              </p>
              <div class="bar w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-3" role="progressbar" :aria-valuenow="usage.percent" aria-valuemin="0" aria-valuemax="100" aria-label="Pemakaian anggaran">
                <span
                  class="block h-full transition-all duration-300"
                  :class="{
                    'bg-brand-600': usage.tone === 'ok',
                    'bg-amber-500': usage.tone === 'warning',
                    'bg-rose-500': usage.tone === 'danger'
                  }"
                  :style="{ width: `${usage.percent}%` }"
                ></span>
              </div>
              <p class="bar-label num text-xs font-semibold text-slate-500 mt-1.5">
                Terpakai {{ formatRupiah(data.financial.monthlySpending) }} ({{ usage.percent }}%)
              </p>
            </template>
            <div v-else class="py-4 text-center">
              <p class="panel-hint text-xs text-slate-500">Anggaran belum diatur. Atur anggaran untuk melihat sisa dana bulan ini.</p>
              <button
                type="button"
                class="mt-2 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                @click="showBudget = true"
              >
                + Tentukan Anggaran Bulanan
              </button>
            </div>
          </div>
        </article>

        <!-- Card 2: Skor Disiplin -->
        <article class="panel discipline bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <h2 class="panel-title text-sm font-bold text-slate-800 self-start">Skor disiplin</h2>
          <div class="ring w-24 h-24 my-2 relative rounded-full flex items-center justify-center shadow-inner" :style="ringStyle">
            <span class="num font-display font-extrabold text-2xl text-slate-900 z-10">{{ data.financial.disciplineScore }}%</span>
          </div>
          <p class="panel-hint text-xs text-slate-500 max-w-xs mt-1">
            <span class="font-bold text-slate-800">{{ disciplineLabel(data.financial.disciplineScore) }}</span>. Dihitung dari keinginan yang dibuka lewat belajar atau dibatalkan.
          </p>
        </article>

        <!-- Card 3: Waktu Belajar -->
        <article class="panel bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 class="panel-title text-sm font-bold text-slate-800">Waktu belajar</h2>
            <p class="big num font-display font-extrabold text-2xl text-brand-700 mt-1">
              {{ formatMinutes(data.study.totalMinutes) }}
            </p>
            <p class="panel-hint text-xs text-slate-500 mt-0.5">dari {{ data.study.totalMissions }} misi selesai</p>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
            <p class="font-semibold text-slate-800">Rata-rata skor: <span class="num font-bold text-brand-600">{{ data.study.avgScore }}</span></p>
            <div class="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Pomodoro: <strong>{{ data.study.pomodoroCount }}</strong></span>
              <span>•</span>
              <span>Active Recall: <strong>{{ data.study.activeRecallCount }}</strong></span>
            </div>
          </div>
        </article>
      </div>

      <!-- Charts Row 1: Alokasi Dana & 7 Hari Terakhir -->
      <div class="charts charts-primary grid grid-cols-1 lg:grid-cols-12 gap-5">
        <article class="panel lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 class="panel-title text-sm font-bold text-slate-800">Alokasi dana</h2>
          <p class="panel-hint text-xs text-slate-500 mb-3">Ke mana uang saku mengalir.</p>
          <div class="h-64 flex items-center justify-center">
            <AllocationChart :allocation="data.charts.allocation" />
          </div>
        </article>

        <article class="panel lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 class="panel-title text-sm font-bold text-slate-800">Tujuh hari terakhir</h2>
          <p class="panel-hint text-xs text-slate-500 mb-3">Pengeluaran berlaku dan menit belajar per hari.</p>
          <div class="h-64 flex items-center justify-center">
            <WeeklyTrendChart :trends="data.charts.weeklyTrends" />
          </div>
        </article>
      </div>

      <!-- Charts Row 2: Kategori & Aktivitas Terbaru -->
      <div class="charts grid grid-cols-1 lg:grid-cols-12 gap-5">
        <article class="panel lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 class="panel-title text-sm font-bold text-slate-800">Pengeluaran per kategori</h2>
          <p class="panel-hint text-xs text-slate-500 mb-3">Pengeluaran berlaku bulan berjalan.</p>
          <div class="h-64 flex items-center justify-center">
            <CategoryChart :categories="data.charts.categorySpending" />
          </div>
        </article>

        <article class="panel lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 class="panel-title text-sm font-bold text-slate-800">Aktivitas terbaru</h2>
            <p class="panel-hint text-xs text-slate-500 mb-3">Transaksi dan sesi misi terakhir.</p>
            <ul class="recent space-y-2.5 max-h-64 overflow-y-auto pr-1">
              <li
                v-for="item in data.recent.transactions"
                :key="`t-${item.id}`"
                class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-xs"
              >
                <div class="overflow-hidden pr-2">
                  <span class="font-semibold text-slate-800 block truncate">{{ item.title }}</span>
                  <small class="text-[11px] text-slate-400 block mt-0.5">{{ formatDate(item.created_at) }}</small>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="chip text-[11px] font-semibold" :class="`chip-${STATUS_TONES[item.status]}`">{{ STATUS_LABELS[item.status] }}</span>
                  <strong class="num text-xs font-bold text-slate-800">{{ formatRupiah(item.amount) }}</strong>
                </div>
              </li>

              <li
                v-for="mission in data.recent.missions"
                :key="`m-${mission.id}`"
                class="flex items-center justify-between p-2.5 rounded-xl border border-brand-100 bg-brand-50/40 text-xs"
              >
                <div class="overflow-hidden pr-2">
                  <span class="font-semibold text-brand-900 block truncate">{{ mission.subject }}</span>
                  <small class="text-[11px] text-brand-700 block mt-0.5">{{ MISSION_LABELS[mission.mission_type] }} · {{ formatDate(mission.completed_at) }}</small>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="chip chip-active text-[11px] font-semibold bg-brand-100 text-brand-800">Misi</span>
                  <strong class="num text-xs font-bold text-brand-900">{{ formatMinutes(mission.duration_minutes) }}</strong>
                </div>
              </li>
            </ul>
            <p v-if="!data.recent.transactions.length && !data.recent.missions.length" class="panel-hint text-xs text-slate-400 text-center py-8">
              Belum ada aktivitas transaksi maupun misi belajar.
            </p>
          </div>
        </article>
      </div>
    </template>

    <BudgetModal v-if="showBudget" :current="data?.financial?.monthlyBudget ?? 0" @close="showBudget = false" @saved="load" />
  </section>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; justify-content: space-between; }
.sub { color: var(--ink-soft); }
.ring {
  background: conic-gradient(var(--moss, #10b981) var(--score, 0%), #e2e8f0 0);
}
.ring::before {
  content: '';
  position: absolute;
  inset: 0.5rem;
  border-radius: 50%;
  background: #ffffff;
}
.recent { list-style: none; margin: 0; padding: 0; }
</style>
