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
const usage = computed(() => budgetUsage(data.value.financial));
const ringStyle = computed(() => ({ '--score': `${data.value.financial.disciplineScore}%` }));

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
  <section>
    <header class="head">
      <div>
        <h1>Halo, {{ firstName(auth.user?.name) || 'Mahasiswa' }}</h1>
        <p class="sub">Ringkasan keuangan dan disiplin belajarmu.</p>
      </div>
      <RouterLink class="btn btn-primary" to="/transaksi"><AppIcon name="plus" /> Catat transaksi</RouterLink>
    </header>

    <p v-if="loadError" class="state error" role="alert">{{ loadError }} <button type="button" class="btn btn-small" @click="load">Coba lagi</button></p>
    <p v-else-if="!data" class="state">Memuat dashboard…</p>

    <template v-else>
      <RouterLink v-if="data.financial.counts.wantsLocked" class="vault" to="/misi">
        <PadlockMark :size="36" />
        <span>
          <strong class="num">{{ data.financial.counts.wantsLocked }} keinginan terkunci</strong>
          senilai <strong class="num">{{ formatRupiah(data.financial.totalWantsLocked) }}</strong>. Selesaikan misi belajar untuk membukanya.
        </span>
        <AppIcon name="arrow" />
      </RouterLink>

      <div class="ledger panel">
        <div class="balance">
          <p class="eyebrow">Saldo aktif</p>
          <p class="balance-value num" :class="{ negative: data.financial.activeBalance < 0 }">{{ formatRupiah(data.financial.activeBalance) }}</p>
          <p class="balance-note">Pemasukan dikurangi pengeluaran yang benar-benar berlaku.</p>
        </div>
        <dl class="figures">
          <div><dt>Pemasukan</dt><dd class="num income">{{ formatRupiah(data.financial.totalIncome) }}</dd></div>
          <div><dt>Pengeluaran berlaku</dt><dd class="num">{{ formatRupiah(data.financial.totalActiveExpenses) }}</dd></div>
          <div><dt>Dana terkunci</dt><dd class="num locked">{{ formatRupiah(data.financial.totalWantsLocked) }}</dd></div>
          <div><dt>Hemat (dibatalkan)</dt><dd class="num saved">{{ formatRupiah(data.financial.totalWantsCancelled) }}</dd></div>
        </dl>
      </div>

      <div class="trio">
        <article class="panel">
          <div class="inline-head">
            <h2 class="panel-title">Anggaran bulan ini</h2>
            <button type="button" class="btn btn-small" @click="showBudget = true">Atur</button>
          </div>
          <template v-if="usage.hasBudget">
            <p class="big num">{{ formatRupiah(Math.abs(data.financial.remainingBudget)) }}</p>
            <p class="panel-hint">{{ usage.over ? 'melebihi anggaran' : 'sisa anggaran' }} dari {{ formatRupiah(data.financial.monthlyBudget) }}</p>
            <div class="bar" role="progressbar" :aria-valuenow="usage.percent" aria-valuemin="0" aria-valuemax="100" aria-label="Pemakaian anggaran">
              <span :class="`bar-${usage.tone}`" :style="{ width: `${usage.percent}%` }"></span>
            </div>
            <p class="bar-label num">Terpakai {{ formatRupiah(data.financial.monthlySpending) }} ({{ usage.percent }}%)</p>
          </template>
          <p v-else class="panel-hint">Anggaran belum diatur. Atur anggaran untuk melihat sisa dana bulan ini.</p>
        </article>

        <article class="panel discipline">
          <h2 class="panel-title">Skor disiplin</h2>
          <div class="ring" :style="ringStyle"><span class="num">{{ data.financial.disciplineScore }}</span></div>
          <p class="panel-hint">{{ disciplineLabel(data.financial.disciplineScore) }}. Dihitung dari keinginan yang dibuka lewat belajar atau dibatalkan.</p>
        </article>

        <article class="panel">
          <h2 class="panel-title">Waktu belajar</h2>
          <p class="big num">{{ formatMinutes(data.study.totalMinutes) }}</p>
          <p class="panel-hint">dari {{ data.study.totalMissions }} misi selesai</p>
          <p class="mini num">Rata-rata skor <strong>{{ data.study.avgScore }}</strong> · Pomodoro {{ data.study.pomodoroCount }} · Recall {{ data.study.activeRecallCount }}</p>
        </article>
      </div>

      <div class="charts charts-primary">
        <article class="panel">
          <h2 class="panel-title">Alokasi dana</h2>
          <p class="panel-hint">Ke mana uangmu mengalir.</p>
          <AllocationChart :allocation="data.charts.allocation" />
        </article>
        <article class="panel">
          <h2 class="panel-title">Tujuh hari terakhir</h2>
          <p class="panel-hint">Pengeluaran berlaku dan menit belajar per hari.</p>
          <WeeklyTrendChart :trends="data.charts.weeklyTrends" />
        </article>
      </div>

      <div class="charts">
        <article class="panel">
          <h2 class="panel-title">Pengeluaran per kategori</h2>
          <p class="panel-hint">Bulan berjalan.</p>
          <CategoryChart :categories="data.charts.categorySpending" />
        </article>

        <article class="panel">
          <h2 class="panel-title">Aktivitas terbaru</h2>
          <p class="panel-hint">Transaksi dan misi terakhir.</p>
          <ul class="recent">
            <li v-for="item in data.recent.transactions" :key="`t-${item.id}`">
              <span>{{ item.title }}<small>{{ formatDate(item.created_at) }}</small></span>
              <span class="chip" :class="`chip-${STATUS_TONES[item.status]}`">{{ STATUS_LABELS[item.status] }}</span>
              <strong class="num">{{ formatRupiah(item.amount) }}</strong>
            </li>
            <li v-for="mission in data.recent.missions" :key="`m-${mission.id}`">
              <span>{{ mission.subject }}<small>{{ MISSION_LABELS[mission.mission_type] }} · {{ formatDate(mission.completed_at) }}</small></span>
              <span class="chip chip-active">Misi</span>
              <strong class="num">{{ formatMinutes(mission.duration_minutes) }}</strong>
            </li>
          </ul>
          <p v-if="!data.recent.transactions.length && !data.recent.missions.length" class="panel-hint">Belum ada aktivitas.</p>
        </article>
      </div>
    </template>

    <BudgetModal v-if="showBudget" :current="data?.financial.monthlyBudget ?? 0" @close="showBudget = false" @saved="load" />
  </section>
</template>

<style scoped>
.head { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; justify-content: space-between; margin-bottom: 1.25rem; }
h1 { font-size: 2rem; }
.sub { color: var(--ink-soft); margin-top: 0.25rem; }
.state { padding: 2rem; text-align: center; color: var(--ink-soft); }
.state.error { color: var(--rose); }
.vault { display: flex; align-items: center; gap: 0.9rem; padding: 0.8rem 1rem; margin-bottom: 1.25rem; background: var(--brass-wash); border: 1.5px solid var(--ink); border-radius: var(--radius-s); color: var(--brass-ink); text-decoration: none; }
.vault span { flex: 1; }
.ledger { display: grid; gap: 1.25rem; margin-bottom: 1.25rem; box-shadow: 5px 5px 0 var(--ink); }
.eyebrow { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); }
.balance-value { font-family: var(--font-display); font-weight: 800; font-size: clamp(2.2rem, 7vw, 3.4rem); line-height: 1.05; margin: 0.15rem 0; }
.balance-value.negative { color: var(--rose); }
.balance-note { color: var(--ink-soft); font-size: 0.9rem; }
.figures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; margin: 0; }
.figures div { padding: 0.6rem 0.9rem; border-left: 1.5px solid var(--line); }
.figures dt { font-size: 0.8rem; color: var(--ink-soft); }
.figures dd { margin: 0.1rem 0 0; font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; }
.income { color: var(--moss); }
.locked { color: var(--brass-ink); }
.saved { color: var(--slate); }
.trio, .charts { display: grid; gap: 1.25rem; margin-bottom: 1.25rem; }
.inline-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.big { font-family: var(--font-display); font-weight: 800; font-size: 1.9rem; line-height: 1.1; }
.bar { height: 0.75rem; margin-top: 0.5rem; background: var(--slate-wash); border: 1.5px solid var(--ink); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; }
.bar-ok { background: var(--cobalt); }
.bar-warning { background: var(--brass); }
.bar-danger { background: var(--rose); }
.bar-label { font-size: 0.85rem; color: var(--ink-soft); margin-top: 0.35rem; }
.mini { font-size: 0.85rem; color: var(--ink-soft); margin-top: 0.5rem; }
.discipline { display: grid; justify-items: start; }
.ring { --score: 0%; display: grid; place-items: center; width: 6.5rem; aspect-ratio: 1; margin: 0.25rem 0 0.75rem; border-radius: 50%; background: conic-gradient(var(--moss) var(--score), var(--slate-wash) 0); position: relative; }
.ring::before { content: ''; position: absolute; inset: 0.6rem; border-radius: 50%; background: var(--surface); }
.ring span { position: relative; font-family: var(--font-display); font-weight: 800; font-size: 1.8rem; }
.recent { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
.recent li { display: grid; grid-template-columns: 1fr auto auto; gap: 0.6rem; align-items: center; padding-bottom: 0.55rem; border-bottom: 1px solid var(--line); }
.recent li:last-child { border-bottom: 0; }
.recent small { display: block; font-size: 0.78rem; color: var(--ink-faint); }
@media (min-width: 48rem) {
  .ledger { grid-template-columns: 1fr 1.3fr; align-items: center; }
  .figures { grid-template-columns: repeat(2, 1fr); }
  .trio { grid-template-columns: repeat(3, 1fr); }
  .charts { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 64rem) {
  .charts-primary { grid-template-columns: 2fr 3fr; }
}
</style>
