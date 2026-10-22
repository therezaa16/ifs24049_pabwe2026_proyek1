import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  completeSession, createTestContext, createTransaction, registerUser, startSession
} from '../helpers/test-context.js';

let ctx;
afterEach(() => ctx.close());

const summary = async (session) => (await ctx.api.get('/api/dashboard/summary').set(session.headers)).body.data;

describe('dashboard kosong', () => {
  beforeEach(() => { ctx = createTestContext(); });

  it('memberi nilai nol, skor penuh, dan sisa anggaran sesuai pengaturan', async () => {
    const withBudget = await registerUser(ctx, { monthly_budget: 1500000 });
    const data = await summary(withBudget);
    expect(data.financial).toMatchObject({
      activeBalance: 0, monthlySpending: 0, remainingBudget: 1500000, disciplineScore: 100, monthlyBudget: 1500000
    });
    expect(data.study).toEqual({ totalMissions: 0, totalMinutes: 0, avgScore: 0, pomodoroCount: 0, activeRecallCount: 0 });
    expect(data.charts.weeklyTrends.dates).toHaveLength(7);
    expect(data.charts.categorySpending).toEqual({ labels: [], data: [] });
    expect(data.recent).toEqual({ transactions: [], missions: [] });

    const noBudget = await registerUser(ctx, { monthly_budget: 0 });
    expect((await summary(noBudget)).financial.remainingBudget).toBeNull();
  });

  it('menolak akses tanpa login', async () => {
    expect((await ctx.api.get('/api/dashboard/summary')).status).toBe(401);
  });
});

describe('dashboard berisi data', () => {
  beforeEach(() => { ctx = createTestContext(); });

  it('hanya menghitung keinginan setelah dibuka lewat misi', async () => {
    const me = await registerUser(ctx, { monthly_budget: 1500000 });
    await createTransaction(ctx, me, { type: 'pemasukan', title: 'Kiriman', amount: 1000000, category: 'Uang Saku' });
    await createTransaction(ctx, me, { type: 'kebutuhan', title: 'Makan', amount: 20000, category: 'Makanan' });
    const opened = await createTransaction(ctx, me, { type: 'keinginan', title: 'Skin', amount: 50000, category: 'Hiburan' });
    await createTransaction(ctx, me, { type: 'keinginan', title: 'Boba', amount: 30000, category: 'Hiburan' });
    const cancelled = await createTransaction(ctx, me, { type: 'keinginan', title: 'Jaket', amount: 10000, category: 'Fashion' });
    await ctx.api.post(`/api/transactions/${cancelled.id}/cancel`).set(me.headers);

    const before = await summary(me);
    expect(before.financial).toMatchObject({ totalActiveExpenses: 20000, totalWantsLocked: 80000 });

    const started = await startSession(ctx, me, {
      mission_type: 'pomodoro', subject: 'Basis Data', duration_minutes: 25, transaction_id: opened.id
    });
    ctx.advanceSeconds(1500);
    await completeSession(ctx, me, started.body.session.id);

    const data = await summary(me);
    expect(data.financial).toMatchObject({
      totalIncome: 1000000, totalNeeds: 20000, totalWantsUnlocked: 50000, totalWantsLocked: 30000,
      totalWantsCancelled: 10000, totalActiveExpenses: 70000, activeBalance: 930000,
      monthlySpending: 70000, remainingBudget: 1430000, disciplineScore: 67
    });
    expect(data.financial.counts).toEqual({ income: 1, needs: 1, wantsUnlocked: 1, wantsLocked: 1, wantsCancelled: 1 });
    expect(data.study).toEqual({ totalMissions: 1, totalMinutes: 25, avgScore: 100, pomodoroCount: 1, activeRecallCount: 0 });
    expect(data.charts.allocation.data).toEqual([20000, 50000, 30000, 10000]);
    expect(data.charts.categorySpending).toEqual({ labels: ['Hiburan', 'Makanan'], data: [50000, 20000] });
    expect(data.charts.weeklyTrends.dates.at(-1)).toBe('2026-10-20');
    expect(data.charts.weeklyTrends.expenses.at(-1)).toBe(70000);
    expect(data.charts.weeklyTrends.studyMinutes.at(-1)).toBe(25);
    expect(data.recent.transactions).toHaveLength(5);
    expect(data.recent.missions).toHaveLength(1);
  });

  it('pengeluaran bulan lalu tetap tampil di tren namun tidak di anggaran bulan ini', async () => {
    ctx.close();
    ctx = createTestContext({ startAt: '2026-09-28T03:00:00.000Z' });
    const me = await registerUser(ctx, { monthly_budget: 100000 });
    await createTransaction(ctx, me, { title: 'Bulan lalu', amount: 40000, category: 'Makanan' });
    ctx.setNow('2026-10-03T03:00:00.000Z');
    await createTransaction(ctx, me, { title: 'Bulan ini', amount: 10000, category: 'Transport' });

    const data = await summary(me);
    expect(data.financial).toMatchObject({ monthlySpending: 10000, remainingBudget: 90000 });
    expect(data.charts.categorySpending.labels).toEqual(['Transport']);
    const { dates, expenses } = data.charts.weeklyTrends;
    expect(expenses[dates.indexOf('2026-09-28')]).toBe(40000);
    expect(expenses[dates.indexOf('2026-10-03')]).toBe(10000);
  });

  it('pengeluaran awal bulan di luar jendela 7 hari tidak masuk tren', async () => {
    ctx.close();
    ctx = createTestContext({ startAt: '2026-10-05T03:00:00.000Z' });
    const me = await registerUser(ctx);
    await createTransaction(ctx, me, { title: 'Awal bulan', amount: 25000 });
    ctx.setNow('2026-10-20T03:00:00.000Z');

    const data = await summary(me);
    expect(data.financial.monthlySpending).toBe(25000);
    expect(data.charts.weeklyTrends.expenses.every((value) => value === 0)).toBe(true);
  });

  it('data pengguna lain tidak ikut terhitung', async () => {
    const me = await registerUser(ctx);
    const other = await registerUser(ctx);
    await createTransaction(ctx, other, { amount: 99000 });
    expect((await summary(me)).financial.totalNeeds).toBe(0);
  });
});
