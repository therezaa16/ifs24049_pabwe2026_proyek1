import { describe, expect, it } from 'vitest';
import { validateBudget, validateLogin, validateRegister } from '../../src/features/auth/domain/auth.validator.js';
import { normalizeEmail, toPublicUser } from '../../src/features/auth/domain/user.js';
import {
  TRANSACTION_STATUSES, TRANSACTION_TYPES, assertCanBeCancelled, assertCanBeUnlocked, buildNewTransaction
} from '../../src/features/transactions/domain/transaction.rules.js';
import {
  validateCreateTransaction, validateTransactionFilters
} from '../../src/features/transactions/domain/transaction.validator.js';
import {
  ELAPSED_TOLERANCE_SECONDS, MISSION_STATUSES, assertMissionMatchesWish, assertPomodoroLongEnoughToUnlock,
  calculateElapsedSeconds, calculateRemainingSeconds, calculateRequiredSeconds, getMissionLabel, isPassingScore
} from '../../src/features/study-missions/domain/mission.rules.js';
import { validateCompleteSession, validateStartSession } from '../../src/features/study-missions/domain/mission.validator.js';
import {
  buildDailyTrend, calculateDisciplineScore, calculateMonthlySpending, startOfLocalDay, startOfLocalMonth,
  summarizeFinancials, toLocalDateKey
} from '../../src/features/dashboard/domain/dashboard.calculator.js';

const validRegister = { name: 'Eliza', email: 'eliza@del.ac.id', password: 'rahasia123' };

describe('auth domain', () => {
  it('menormalkan email dan menyembunyikan password', () => {
    expect(normalizeEmail('  Eliza@Del.AC.id ')).toBe('eliza@del.ac.id');
    expect(toPublicUser({ id: 1, name: 'E', email: 'e@x.id', monthly_budget: 5, created_at: 't', password: 'hash' }))
      .toEqual({ id: 1, name: 'E', email: 'e@x.id', monthly_budget: 5, created_at: 't' });
  });

  it('menerima registrasi valid dengan atau tanpa anggaran', () => {
    expect(validateRegister(validRegister)).toEqual({});
    expect(validateRegister({ ...validRegister, monthly_budget: null })).toEqual({});
    expect(validateRegister({ ...validRegister, monthly_budget: '1500000' })).toEqual({});
  });

  it('melaporkan setiap kesalahan registrasi', () => {
    expect(Object.keys(validateRegister())).toEqual(['name', 'email', 'password']);
    expect(validateRegister({ ...validRegister, name: 'E' }).name).toMatch(/minimal/);
    expect(validateRegister({ ...validRegister, name: 'E'.repeat(101) }).name).toMatch(/maksimal/);
    expect(validateRegister({ ...validRegister, name: 5 }).name).toMatch(/wajib/);
    expect(validateRegister({ ...validRegister, email: 'bukan-email' }).email).toBeDefined();
    expect(validateRegister({ ...validRegister, email: `${'a'.repeat(250)}@b.co` }).email).toMatch(/maksimal/);
    expect(validateRegister({ ...validRegister, password: '123' }).password).toMatch(/minimal/);
    expect(validateRegister({ ...validRegister, password: 123456 }).password).toMatch(/minimal/);
    expect(validateRegister({ ...validRegister, password: 'a'.repeat(73) }).password).toMatch(/byte/);
    expect(validateRegister({ ...validRegister, monthly_budget: -1 }).monthly_budget).toBeDefined();
    expect(validateRegister({ ...validRegister, monthly_budget: 'abc' }).monthly_budget).toBeDefined();
    expect(validateRegister({ ...validRegister, monthly_budget: 1e13 }).monthly_budget).toBeDefined();
  });

  it('memvalidasi login dan anggaran', () => {
    expect(validateLogin({ email: 'a@b.c', password: 'x' })).toEqual({});
    expect(Object.keys(validateLogin())).toEqual(['email', 'password']);
    expect(validateBudget({ monthly_budget: 0 })).toEqual({});
    expect(validateBudget().monthly_budget).toMatch(/wajib/);
    expect(validateBudget({ monthly_budget: null }).monthly_budget).toMatch(/wajib/);
    expect(validateBudget({ monthly_budget: -5 }).monthly_budget).toMatch(/non-negatif/);
  });
});

describe('transaction domain', () => {
  it('keinginan lahir TERKUNCI, selain itu AKTIF', () => {
    const want = buildNewTransaction({ type: 'keinginan', title: ' Kopi ', amount: '25000', category: ' Kopi ', note: ' enak ' });
    expect(want).toEqual({
      type: 'keinginan', title: 'Kopi', amount: 25000, category: 'Kopi', note: 'enak',
      status: TRANSACTION_STATUSES.LOCKED, mission_type: 'pomodoro'
    });

    const recall = buildNewTransaction({ type: 'keinginan', title: 'Sepatu', amount: 1, category: 'x', mission_type: 'active_recall' });
    expect(recall.mission_type).toBe('active_recall');

    const need = buildNewTransaction({ type: 'kebutuhan', title: 'Buku', amount: 5, category: 'x', note: 7, mission_type: 'active_recall' });
    expect(need).toMatchObject({ status: 'aktif', mission_type: null, note: '' });
  });

  it('memeriksa kelayakan buka dan batal', () => {
    const lockedWant = { type: 'keinginan', status: 'terkunci' };
    expect(() => assertCanBeUnlocked(lockedWant)).not.toThrow();
    expect(() => assertCanBeCancelled(lockedWant)).not.toThrow();
    expect(() => assertCanBeUnlocked({ type: 'kebutuhan', status: 'aktif' })).toThrow(/Keinginan/);
    expect(() => assertCanBeUnlocked({ type: 'keinginan', status: 'terbuka' })).toThrow(/terbuka/);
    expect(() => assertCanBeCancelled({ type: 'kebutuhan', status: 'aktif' })).toThrow(/Keinginan/);
    expect(() => assertCanBeCancelled({ type: 'keinginan', status: 'terbuka' })).toThrow(/terkunci/);
  });

  const validTx = { title: 'Nasi Padang', type: 'kebutuhan', amount: 20000, category: 'Makanan' };

  it('menerima transaksi valid', () => {
    expect(validateCreateTransaction(validTx)).toEqual({});
    expect(validateCreateTransaction({ ...validTx, amount: '20000', note: 'ok' })).toEqual({});
    expect(validateCreateTransaction({ ...validTx, type: 'keinginan', mission_type: 'active_recall' })).toEqual({});
    expect(validateCreateTransaction({ ...validTx, type: 'keinginan' })).toEqual({});
    expect(validateCreateTransaction({ ...validTx, mission_type: 'ngawur' })).toEqual({});
  });

  it('melaporkan setiap kesalahan transaksi', () => {
    expect(Object.keys(validateCreateTransaction())).toEqual(['title', 'type', 'amount', 'category']);
    expect(validateCreateTransaction({ ...validTx, title: 'A' }).title).toMatch(/minimal/);
    expect(validateCreateTransaction({ ...validTx, title: 'A'.repeat(101) }).title).toMatch(/maksimal/);
    expect(validateCreateTransaction({ ...validTx, amount: 0 }).amount).toBeDefined();
    expect(validateCreateTransaction({ ...validTx, amount: 'abc' }).amount).toBeDefined();
    expect(validateCreateTransaction({ ...validTx, amount: 1e13 }).amount).toBeDefined();
    expect(validateCreateTransaction({ ...validTx, category: 'K'.repeat(61) }).category).toMatch(/maksimal/);
    expect(validateCreateTransaction({ ...validTx, note: 5 }).note).toBeDefined();
    expect(validateCreateTransaction({ ...validTx, note: 'n'.repeat(256) }).note).toBeDefined();
    expect(validateCreateTransaction({ ...validTx, type: 'keinginan', mission_type: 'ngawur' }).mission_type).toBeDefined();
  });

  it('memvalidasi filter daftar', () => {
    expect(validateTransactionFilters()).toEqual({});
    expect(validateTransactionFilters({ type: 'keinginan', status: 'terkunci' })).toEqual({});
    expect(Object.keys(validateTransactionFilters({ type: 'x', status: 'y' }))).toEqual(['type', 'status']);
    expect(TRANSACTION_TYPES.WANT).toBe('keinginan');
  });
});

describe('mission domain', () => {
  it('menghitung waktu wajib, berlalu, dan sisa', () => {
    expect(calculateRequiredSeconds({ missionType: 'pomodoro', durationMinutes: 25, cardCount: 0, timeScale: 1 })).toBe(1500);
    expect(calculateRequiredSeconds({ missionType: 'pomodoro', durationMinutes: 25, cardCount: 0, timeScale: 0.04 })).toBe(60);
    expect(calculateRequiredSeconds({ missionType: 'active_recall', durationMinutes: 0, cardCount: 3, timeScale: 1 })).toBe(45);
    expect(calculateRequiredSeconds({ missionType: 'active_recall', durationMinutes: 0, cardCount: 0, timeScale: 1 })).toBe(1);

    const start = '2026-10-20T03:00:00.000Z';
    expect(calculateElapsedSeconds(start, new Date('2026-10-20T03:01:30.900Z'))).toBe(90);
    expect(calculateElapsedSeconds(start, new Date('2026-10-20T02:00:00.000Z'))).toBe(0);
    expect(calculateRemainingSeconds({ requiredSeconds: 60, elapsedSeconds: 10 })).toBe(60 - ELAPSED_TOLERANCE_SECONDS - 10);
    expect(calculateRemainingSeconds({ requiredSeconds: 60, elapsedSeconds: 59 })).toBe(0);
  });

  it('menilai skor dan aturan buka', () => {
    expect(isPassingScore(70)).toBe(true);
    expect(isPassingScore(69)).toBe(false);
    expect(getMissionLabel('pomodoro')).toBe('Pomodoro');
    expect(getMissionLabel('active_recall')).toBe('Active Recall');
    expect(MISSION_STATUSES.RUNNING).toBe('berjalan');
    expect(() => assertPomodoroLongEnoughToUnlock(25)).not.toThrow();
    expect(() => assertPomodoroLongEnoughToUnlock(15)).toThrow(/minimal 25/);
    expect(() => assertMissionMatchesWish({ mission_type: 'pomodoro' }, 'pomodoro')).not.toThrow();
    expect(() => assertMissionMatchesWish({ mission_type: 'pomodoro' }, 'active_recall')).toThrow(/Pomodoro/);
  });

  it('memvalidasi memulai sesi', () => {
    expect(validateStartSession({ mission_type: 'pomodoro', subject: 'Basis Data', duration_minutes: 25 })).toEqual({});
    expect(validateStartSession({ mission_type: 'active_recall', deck_id: 1, transaction_id: null })).toEqual({});
    expect(validateStartSession({ mission_type: 'active_recall', deck_id: '2', transaction_id: '3' })).toEqual({});
    expect(validateStartSession().mission_type).toBeDefined();
    expect(validateStartSession({ mission_type: 'pomodoro', duration_minutes: 200 })).toMatchObject({
      subject: expect.any(String), duration_minutes: expect.any(String)
    });
    expect(validateStartSession({ mission_type: 'pomodoro', subject: 'A', duration_minutes: 25 }).subject).toMatch(/minimal/);
    expect(validateStartSession({ mission_type: 'pomodoro', subject: 'A'.repeat(101), duration_minutes: 25 }).subject).toMatch(/maksimal/);
    expect(validateStartSession({ mission_type: 'pomodoro', subject: 'Basis Data', duration_minutes: 2.5 }).duration_minutes).toBeDefined();
    expect(validateStartSession({ mission_type: 'active_recall' }).deck_id).toBeDefined();
    expect(validateStartSession({ mission_type: 'active_recall', deck_id: 1, transaction_id: 'abc' }).transaction_id).toBeDefined();
    expect(validateStartSession({ mission_type: 'active_recall', deck_id: 1, transaction_id: 0 }).transaction_id).toBeDefined();
  });

  it('memvalidasi penyelesaian sesi', () => {
    expect(validateCompleteSession()).toEqual({});
    expect(validateCompleteSession({ score: null })).toEqual({});
    expect(validateCompleteSession({ score: 0 })).toEqual({});
    expect(validateCompleteSession({ score: '85' })).toEqual({});
    expect(validateCompleteSession({ score: 101 }).score).toBeDefined();
    expect(validateCompleteSession({ score: 5.5 }).score).toBeDefined();
    expect(validateCompleteSession({ score: 'abc' }).score).toBeDefined();
  });
});

describe('dashboard calculator', () => {
  const rows = [
    { type: 'pemasukan', status: 'aktif', total: 1000, count: 2 },
    { type: 'kebutuhan', status: 'aktif', total: 300, count: 3 },
    { type: 'keinginan', status: 'terbuka', total: 100, count: 1 },
    { type: 'keinginan', status: 'terkunci', total: 50, count: 1 },
    { type: 'keinginan', status: 'dibatalkan', total: 70, count: 2 },
    { type: 'keinginan', status: 'aktif', total: 9, count: 9 },
    { type: 'pemasukan', status: 'terkunci', total: 9, count: 9 }
  ];

  it('merangkum dan mengabaikan kombinasi yang tidak dikenal', () => {
    const buckets = summarizeFinancials(rows);
    expect(buckets.income).toEqual({ amount: 1000, count: 2 });
    expect(buckets.needs).toEqual({ amount: 300, count: 3 });
    expect(buckets.wantsUnlocked.amount).toBe(100);
    expect(buckets.wantsLocked.count).toBe(1);
    expect(buckets.wantsCancelled.count).toBe(2);
  });

  it('menghitung skor disiplin', () => {
    const buckets = summarizeFinancials(rows);
    expect(calculateDisciplineScore(buckets)).toBe(75);
    expect(calculateDisciplineScore(summarizeFinancials([]))).toBe(100);
  });

  it('menghitung batas hari/bulan lokal dan kunci tanggal', () => {
    const now = new Date('2026-10-20T20:00:00.000Z');
    expect(toLocalDateKey(now, 420)).toBe('2026-10-21');
    expect(toLocalDateKey(now, 0)).toBe('2026-10-20');
    expect(startOfLocalDay(now, 420, 0).toISOString()).toBe('2026-10-20T17:00:00.000Z');
    expect(startOfLocalDay(now, 420, 6).toISOString()).toBe('2026-10-14T17:00:00.000Z');
    expect(startOfLocalMonth(now, 420).toISOString()).toBe('2026-09-30T17:00:00.000Z');
  });

  it('menghitung pengeluaran bulan berjalan', () => {
    const now = new Date('2026-10-03T03:00:00.000Z');
    const expenseRows = [
      { occurred_at: '2026-10-02T03:00:00.000Z', amount: 10 },
      { occurred_at: '2026-09-28T03:00:00.000Z', amount: 99 }
    ];
    expect(calculateMonthlySpending({ now, offsetMinutes: 420, expenseRows })).toBe(10);
  });

  it('membangun tren harian dan mengabaikan data di luar jendela', () => {
    const now = new Date('2026-10-20T03:00:00.000Z');
    const trend = buildDailyTrend({
      now, offsetMinutes: 420, days: 3,
      expenseRows: [
        { occurred_at: '2026-10-20T01:00:00.000Z', amount: 10 },
        { occurred_at: '2026-10-20T02:00:00.000Z', amount: 5 },
        { occurred_at: '2026-10-05T01:00:00.000Z', amount: 999 }
      ],
      studyRows: [{ completed_at: '2026-10-19T03:00:00.000Z', duration_minutes: 25 }]
    });
    expect(trend.dates).toEqual(['2026-10-18', '2026-10-19', '2026-10-20']);
    expect(trend.expenses).toEqual([0, 0, 15]);
    expect(trend.studyMinutes).toEqual([0, 25, 0]);
  });
});
