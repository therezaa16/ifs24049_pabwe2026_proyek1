import { describe, expect, it } from 'vitest';
import { resolveRedirect, validateLoginForm, validateRegisterForm } from '@/features/auth/domain/auth.validators.js';
import {
  filterTransactions, isLockedWish, presentAmount
} from '@/features/transactions/domain/transaction.model.js';
import { validateTransactionForm } from '@/features/transactions/domain/transaction.validators.js';
import {
  calculateAverageScore, isPassing, isPresetAllowed, scaledSeconds, wishesForMission
} from '@/features/study-missions/domain/mission.model.js';
import { budgetUsage, disciplineLabel, firstName, hasChartData } from '@/features/dashboard/domain/dashboard.model.js';

describe('validator auth', () => {
  it('login', () => {
    expect(validateLoginForm({ email: 'a@b.co', password: 'x' })).toEqual({});
    expect(Object.keys(validateLoginForm({ email: 'salah', password: '' }))).toEqual(['email', 'password']);
  });

  it('register', () => {
    const valid = { name: 'Eliza', email: 'e@x.id', password: 'rahasia', confirmPassword: 'rahasia', monthlyBudget: '' };
    expect(validateRegisterForm(valid)).toEqual({});
    expect(validateRegisterForm({ ...valid, monthlyBudget: '100000' })).toEqual({});
    expect(Object.keys(validateRegisterForm({ name: 'E', email: 'x', password: '1', confirmPassword: '2', monthlyBudget: '-5' })))
      .toEqual(['name', 'email', 'password', 'confirmPassword', 'monthlyBudget']);
  });

  it('redirect hanya ke path internal', () => {
    expect(resolveRedirect('/transaksi')).toBe('/transaksi');
    expect(resolveRedirect('//evil.com')).toBe('/');
    expect(resolveRedirect('https://evil.com')).toBe('/');
    expect(resolveRedirect(undefined)).toBe('/');
    expect(resolveRedirect(['/a'])).toBe('/');
  });
});

describe('model transaksi', () => {
  const want = (status) => ({ type: 'keinginan', status });

  it('mengenali keinginan terkunci dan menyaring daftar', () => {
    expect(isLockedWish(want('terkunci'))).toBe(true);
    expect(isLockedWish(want('terbuka'))).toBe(false);
    expect(isLockedWish({ type: 'kebutuhan', status: 'terkunci' })).toBe(false);

    const items = [{ type: 'pemasukan', status: 'aktif' }, want('terkunci'), want('terbuka')];
    expect(filterTransactions(items)).toHaveLength(3);
    expect(filterTransactions(items, { type: 'keinginan' })).toHaveLength(2);
    expect(filterTransactions(items, { type: 'keinginan', status: 'terbuka' })).toHaveLength(1);
    expect(filterTransactions(items, { status: 'aktif' })).toHaveLength(1);
  });

  it('menampilkan tanda nominal sesuai kondisi uang', () => {
    expect(presentAmount({ type: 'pemasukan', status: 'aktif' })).toEqual({ prefix: '+', tone: 'positive' });
    expect(presentAmount(want('terkunci'))).toEqual({ prefix: '', tone: 'pending' });
    expect(presentAmount(want('dibatalkan'))).toEqual({ prefix: '', tone: 'muted' });
    expect(presentAmount(want('terbuka'))).toEqual({ prefix: '−', tone: 'negative' });
    expect(presentAmount({ type: 'kebutuhan', status: 'aktif' }).tone).toBe('negative');
  });

  it('validasi form transaksi', () => {
    expect(validateTransactionForm({ title: 'Kopi', amount: '5000', category: 'Hiburan' })).toEqual({});
    expect(Object.keys(validateTransactionForm({ title: 'K', amount: '0', category: ' ' }))).toEqual(['title', 'amount', 'category']);
  });
});

describe('model misi', () => {
  it('menghitung skor, kelulusan, dan preset durasi', () => {
    expect(calculateAverageScore([100, 100, 60])).toBe(87);
    expect(calculateAverageScore([])).toBe(0);
    expect(isPassing(70, 70)).toBe(true);
    expect(isPassing(69, 70)).toBe(false);
    expect(isPresetAllowed(15, { hasWish: true, minToUnlock: 25 })).toBe(false);
    expect(isPresetAllowed(25, { hasWish: true, minToUnlock: 25 })).toBe(true);
    expect(isPresetAllowed(15, { hasWish: false, minToUnlock: 25 })).toBe(true);
    expect(scaledSeconds(25, 1)).toBe(1500);
    expect(scaledSeconds(25, 0.04)).toBe(60);
    expect(scaledSeconds(0, 0.001)).toBe(1);
  });

  it('menyaring keinginan sesuai jenis misi', () => {
    const wishes = [{ id: 1, mission_type: 'pomodoro' }, { id: 2, mission_type: 'active_recall' }];
    expect(wishesForMission(wishes, 'active_recall')).toEqual([wishes[1]]);
  });
});

describe('model dashboard', () => {
  it('pemakaian anggaran', () => {
    expect(budgetUsage({ monthlyBudget: 0, monthlySpending: 5 })).toMatchObject({ hasBudget: false, tone: 'none' });
    expect(budgetUsage({ monthlyBudget: 100, monthlySpending: 50 })).toMatchObject({ percent: 50, tone: 'ok', over: false });
    expect(budgetUsage({ monthlyBudget: 100, monthlySpending: 85 }).tone).toBe('warning');
    expect(budgetUsage({ monthlyBudget: 100, monthlySpending: 150 })).toMatchObject({ percent: 100, tone: 'danger', over: true });
    expect(budgetUsage({ monthlyBudget: 100, monthlySpending: -10 }).percent).toBe(0);
  });

  it('label, data grafik, dan nama depan', () => {
    expect(disciplineLabel(90)).toBe('Sangat disiplin');
    expect(disciplineLabel(60)).toBe('Cukup disiplin');
    expect(disciplineLabel(10)).toMatch(/menunggu/);
    expect(hasChartData([0, 0])).toBe(false);
    expect(hasChartData([0, 5])).toBe(true);
    expect(firstName('Eliza Novita')).toBe('Eliza');
    expect(firstName()).toBe('');
  });
});
