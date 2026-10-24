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
  <section class="space-y-8">
    <!-- Header with Welcome Greeting -->
    <header class="head flex flex-wrap gap-6 items-start justify-between">
      <div class="space-y-2">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/15">
            <span class="text-lg">🎓</span>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Dashboard</p>
            <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Halo, {{ firstName(auth.user?.name) || 'Mahasiswa' }}!
            </h1>
          </div>
        </div>
        <p class="sub text-sm md:text-base text-slate-500 max-w-2xl">
          Pantau saldo aktif, anggaran saku, dan capaian misi belajar Active Recall & Pomodoro dalam satu tampilan yang terarah.
        </p>
      </div>
      <RouterLink
        class="btn btn-primary px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2 shrink-0"
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
        class="vault group relative overflow-hidden flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-amber-50 via-orange-50/80 to-rose-50/40 border border-amber-200/80 rounded-3xl text-amber-900 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
        to="/misi"
      >
        <div class="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-amber-100/40 to-transparent"></div>
        <div class="relative flex items-center gap-4">
          <div class="p-3 bg-white/80 rounded-2xl shadow-inner group-hover:scale-105 transition-transform">
            <PadlockMark :size="34" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-semibold leading-relaxed">
              <span class="num font-bold text-amber-950">{{ data.financial.counts.wantsLocked }} keinginan terkunci</span>
              senilai <span class="num font-bold text-amber-950">{{ formatRupiah(data.financial.totalWantsLocked) }}</span>
            </p>
            <p class="text-xs text-amber-800/80">Selesaikan misi belajar di halaman Misi Belajar untuk membuka gembok dan menghitungnya sebagai pengeluaran.</p>
          </div>
        </div>
        <div class="relative flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 text-amber-900 text-sm font-semibold shadow-sm group-hover:translate-x-1 transition-transform">
          Buka sekarang
          <AppIcon name="arrow" :size="18" />
        </div>
      </RouterLink>

      <!-- Primary Financial Hero Ledger -->
      <div class="ledger relative overflow-hidden panel grid md:grid-cols-12 gap-6 items-center">
        <div class="absolute -top-20 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 blur-3xl"></div>
        <div class="balance relative md:col-span-5 space-y-2">
          <span class="eyebrow inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-[11px] font-extrabold uppercase tracking-[0.25em] text-indigo-600">Saldo aktif tersedia</span>
          <p
            class="balance-value num font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none"
            :class="data.financial.activeBalance < 0 ? 'negative text-rose-600' : 'text-slate-900'"
          >
            {{ formatRupiah(data.financial.activeBalance) }}
          </p>
          <p class="balance-note text-sm text-slate-500">
            Pemasukan riil dikurangi pengeluaran yang benar-benar berlaku. Dana terkunci tidak ikut mengurangi saldo.
          </p>
        </div>

        <dl class="figures relative md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 m-0">
          <div class="group p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white border border-emerald-100 space-y-1 shadow-sm hover:shadow-md transition-all">
            <dt class="text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Pemasukan
            </dt>
            <dd class="num income font-display font-extrabold text-xl text-emerald-700 m-0">
              {{ formatRupiah(data.financial.totalIncome) }}
            </dd>
          </div>

          <div class="group p-4 rounded-2xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-100 space-y-1 shadow-sm hover:shadow-md transition-all">
            <dt class="text-xs font-semibold text-slate-600 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span> Pengeluaran berlaku
            </dt>
            <dd class="num font-display font-extrabold text-xl text-slate-900 m-0">
              {{ formatRupiah(data.financial.totalActiveExpenses) }}
            </dd>
          </div>

          <div class="group p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-white border border-amber-100 space-y-1 shadow-sm hover:shadow-md transition-all">
            <dt class="text-xs font-semibold text-amber-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span> Dana terkunci
            </dt>
            <dd class="num locked font-display font-extrabold text-xl text-amber-900 m-0">
              {{ formatRupiah(data.financial.totalWantsLocked) }}
            </dd>
          </div>

          <div class="group p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-100 space-y-1 shadow-sm hover:shadow-md transition-all">
            <dt class="text-xs font-semibold text-indigo-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span> Hemat (dibatalkan)
            </dt>
            <dd class="num saved font-display font-extrabold text-xl text-indigo-900 m-0">
              {{ formatRupiah(data.financial.totalWantsCancelled) }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Trio Metrics: Anggaran, Skor Disiplin, Waktu Belajar -->
      <div class="trio grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- Card 1: Anggaran Bulan Ini -->
        <article class="panel group relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl"></div>
          <div class="relative">
            <div class="inline-head flex justify-between items-start gap-2 mb-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">Anggaran</p>
                <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">Bulan ini</h2>
              </div>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/70 transition-all"
                @click="showBudget = true"
              >
                Atur
              </button>
            </div>
            <template v-if="usage.hasBudget">
              <p class="big num font-display font-extrabold text-3xl text-slate-900">
                {{ formatRupiah(Math.abs(data.financial.remainingBudget)) }}
              </p>
              <p class="panel-hint text-sm text-slate-500 mt-1">
                {{ usage.over ? 'Melebihi anggaran' : 'Sisa anggaran' }} dari {{ formatRupiah(data.financial.monthlyBudget) }}
              </p>
              <div class="bar w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-5" role="progressbar" :aria-valuenow="usage.percent" aria-valuemin="0" aria-valuemax="100" aria-label="Pemakaian anggaran">
                <span
                  class="block h-full transition-all duration-500"
                  :class="{
                    'bg-gradient-to-r from-indigo-500 to-violet-500': usage.tone === 'ok',
                    'bg-gradient-to-r from-amber-400 to-orange-500': usage.tone === 'warning',
                    'bg-gradient-to-r from-rose-500 to-red-500': usage.tone === 'danger'
                  }"
                  :style="{ width: `${usage.percent}%` }"
                ></span>
              </div>
              <p class="bar-label num text-xs font-semibold text-slate-500 mt-2">
                Terpakai {{ formatRupiah(data.financial.monthlySpending) }} • {{ usage.percent }}%
              </p>
            </template>
            <div v-else class="py-6 text-center space-y-3">
              <p class="panel-hint text-sm text-slate-500">Belum ada anggaran bulanan. Atur agar sisa dana lebih terkontrol.</p>
              <button
                type="button"
                class="px-4 py-2 text-sm font-semibold rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all"
                @click="showBudget = true"
              >
                + Tentukan Anggaran Bulanan
              </button>
            </div>
          </div>
        </article>

        <!-- Card 2: Skor Disiplin -->
        <article class="panel relative overflow-hidden flex flex-col items-center text-center">
          <div class="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl"></div>
          <div class="relative self-start mb-4">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Disiplin</p>
            <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">Skor kamu</h2>
          </div>
          <div class="ring relative w-28 h-28 my-2" :style="ringStyle">
            <div class="absolute inset-2 rounded-full bg-white flex items-center justify-center shadow-inner">
              <span class="num font-display font-extrabold text-3xl text-slate-900">{{ data.financial.disciplineScore }}%</span>
            </div>
          </div>
          <p class="panel-hint text-sm text-slate-500 max-w-xs mt-3">
            <span class="font-bold text-slate-900">{{ disciplineLabel(data.financial.disciplineScore) }}</span>. Dihitung dari keinginan yang dibuka lewat belajar atau dibatalkan.
          </p>
        </article>

        <!-- Card 3: Waktu Belajar -->
        <article class="panel relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -top-16 -right-10 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-transparent blur-2xl"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">Belajar</p>
            <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">Total waktu</h2>
            <p class="big num font-display font-extrabold text-3xl text-slate-900 mt-3">
              {{ formatMinutes(data.study.totalMinutes) }}
            </p>
            <p class="panel-hint text-sm text-slate-500 mt-1">dari {{ data.study.totalMissions }} misi selesai</p>
          </div>
          <div class="relative mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 space-y-2">
            <p class="text-sm font-semibold text-slate-900">Rata-rata skor: <span class="num font-bold text-violet-600">{{ data.study.avgScore }}</span></p>
            <div class="flex items-center gap-4 text-xs text-slate-500">
              <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Pomodoro: <strong class="text-slate-700">{{ data.study.pomodoroCount }}</strong></span>
              <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Recall: <strong class="text-slate-700">{{ data.study.activeRecallCount }}</strong></span>
            </div>
          </div>
        </article>
      </div>

      <!-- Charts Row 1: Alokasi Dana & 7 Hari Terakhir -->
      <div class="charts charts-primary grid grid-cols-1 lg:grid-cols-12 gap-5">
        <article class="panel lg:col-span-5 relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">Alokasi</p>
            <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">Dana saku</h2>
            <p class="panel-hint text-sm text-slate-500">Proporsi keinginan vs kebutuhan berdasarkan status saat ini.</p>
            <div class="h-64 flex items-center justify-center">
              <AllocationChart :allocation="data.charts.allocation" />
            </div>
          </div>
        </article>

        <article class="panel lg:col-span-7 relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-transparent blur-2xl"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">Tren</p>
            <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">7 hari terakhir</h2>
            <p class="panel-hint text-sm text-slate-500">Pengeluaran berlaku dan menit belajar per hari untuk melihat ritme belajarmu.</p>
            <div class="h-64 flex items-center justify-center">
              <WeeklyTrendChart :trends="data.charts.weeklyTrends" />
            </div>
          </div>
        </article>
      </div>

      <!-- Charts Row 2: Kategori & Aktivitas Terbaru -->
      <div class="charts grid grid-cols-1 lg:grid-cols-12 gap-5">
        <article class="panel lg:col-span-6 relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Kategori</p>
            <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">Pengeluaran per kategori</h2>
            <p class="panel-hint text-sm text-slate-500">Pengeluaran berlaku bulan berjalan untuk mengetahui pos terbesar.</p>
            <div class="h-64 flex items-center justify-center">
              <CategoryChart :categories="data.charts.categorySpending" />
            </div>
          </div>
        </article>

        <article class="panel lg:col-span-6 flex flex-col justify-between relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl"></div>
          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-500">Aktivitas</p>
            <h2 class="panel-title text-lg font-extrabold text-slate-900 mt-1">Terbaru</h2>
            <p class="panel-hint text-sm text-slate-500">Transaksi terakhir dan sesi misi yang baru selesai.</p>
            <ul class="recent space-y-2.5 max-h-64 overflow-y-auto pr-1">
              <li
                v-for="item in data.recent.transactions"
                :key="`t-${item.id}`"
                class="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all text-sm"
              >
                <div class="overflow-hidden pr-3">
                  <span class="font-semibold text-slate-900 block truncate">{{ item.title }}</span>
                  <small class="text-xs text-slate-400 block mt-0.5">{{ formatDate(item.created_at) }}</small>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold" :class="`chip-${STATUS_TONES[item.status]}`">{{ STATUS_LABELS[item.status] }}</span>
                  <strong class="num text-sm font-bold text-slate-900">{{ formatRupiah(item.amount) }}</strong>
                </div>
              </li>

              <li
                v-for="mission in data.recent.missions"
                :key="`m-${mission.id}`"
                class="flex items-center justify-between p-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/60 to-white text-sm"
              >
                <div class="overflow-hidden pr-3">
                  <span class="font-semibold text-violet-900 block truncate">{{ mission.subject }}</span>
                  <small class="text-xs text-violet-600/80 block mt-0.5">{{ MISSION_LABELS[mission.mission_type] }} · {{ formatDate(mission.completed_at) }}</small>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-700">Misi</span>
                  <strong class="num text-sm font-bold text-violet-900">{{ formatMinutes(mission.duration_minutes) }}</strong>
                </div>
              </li>
            </ul>
            <p v-if="!data.recent.transactions.length && !data.recent.missions.length" class="panel-hint text-sm text-slate-400 text-center py-10">
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
  background: conic-gradient(#22c55e var(--score, 0%), #e5e7eb 0);
}
.recent { list-style: none; margin: 0; padding: 0; }
</style>
