import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { authGuard } from '@/app/router/index.js';
import { endSession } from '@/app/session.js';
import { useCountdown } from '@/features/study-missions/application/useCountdown.js';
import { useAuthStore } from '@/features/auth/application/auth.store.js';
import { useDashboardStore } from '@/features/dashboard/application/dashboard.store.js';
import { useMissionsStore } from '@/features/study-missions/application/missions.store.js';
import { useTransactionsStore } from '@/features/transactions/application/transactions.store.js';
import { authApi } from '@/features/auth/infrastructure/auth.api.js';
import { dashboardApi } from '@/features/dashboard/infrastructure/dashboard.api.js';
import { missionsApi } from '@/features/study-missions/infrastructure/missions.api.js';
import { transactionsApi } from '@/features/transactions/infrastructure/transactions.api.js';

vi.mock('@/features/auth/infrastructure/auth.api.js', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), updateBudget: vi.fn() }
}));
vi.mock('@/features/dashboard/infrastructure/dashboard.api.js', () => ({ dashboardApi: { summary: vi.fn() } }));
vi.mock('@/features/study-missions/infrastructure/missions.api.js', () => ({
  missionsApi: { settings: vi.fn(), decks: vi.fn(), history: vi.fn(), start: vi.fn(), complete: vi.fn() }
}));
vi.mock('@/features/transactions/infrastructure/transactions.api.js', () => ({
  transactionsApi: { list: vi.fn(), create: vi.fn(), cancel: vi.fn(), remove: vi.fn() }
}));

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  vi.clearAllMocks();
});

describe('auth store', () => {
  const session = { token: 'tok', user: { id: 1, name: 'Eliza' } };

  it('login dan register memulai sesi serta menyimpan token', async () => {
    authApi.login.mockResolvedValue(session);
    authApi.register.mockResolvedValue(session);
    const auth = useAuthStore();

    await auth.login({ email: 'a', password: 'b' });
    expect(auth.isAuthenticated).toBe(true);
    expect(localStorage.getItem('dfm.token')).toBe('tok');

    auth.clearSession();
    expect(auth.isAuthenticated).toBe(false);
    expect(localStorage.getItem('dfm.token')).toBeNull();

    await auth.register({});
    expect(auth.user.name).toBe('Eliza');
  });

  it('memulihkan sesi dari token tersimpan, atau membersihkannya bila gagal', async () => {
    localStorage.setItem('dfm.token', 'lama');
    authApi.me.mockResolvedValueOnce({ user: { id: 1, name: 'Eliza' } });
    const auth = useAuthStore();
    await auth.restoreSession();
    expect(auth.user.id).toBe(1);

    await auth.restoreSession();
    expect(authApi.me).toHaveBeenCalledTimes(1);

    auth.user = null;
    authApi.me.mockRejectedValueOnce(new Error('401'));
    await auth.restoreSession();
    expect(auth.isAuthenticated).toBe(false);
    await auth.restoreSession();
    expect(authApi.me).toHaveBeenCalledTimes(2);
  });

  it('memperbarui anggaran', async () => {
    authApi.updateBudget.mockResolvedValue({ user: { id: 1, monthly_budget: 2 } });
    const auth = useAuthStore();
    await auth.updateBudget(2);
    expect(auth.user.monthly_budget).toBe(2);
  });

  it('guard router mengarahkan sesuai status login', () => {
    const auth = useAuthStore();
    expect(authGuard({ meta: { requiresAuth: true }, fullPath: '/misi' })).toEqual({ name: 'login', query: { redirect: '/misi' } });
    expect(authGuard({ meta: { requiresAuth: true }, fullPath: '/' })).toEqual({ name: 'login', query: {} });
    expect(authGuard({ meta: { guestOnly: true }, fullPath: '/masuk' })).toBe(true);

    auth.token = 'tok';
    expect(authGuard({ meta: { requiresAuth: true }, fullPath: '/' })).toBe(true);
    expect(authGuard({ meta: { guestOnly: true }, fullPath: '/masuk' })).toEqual({ name: 'dashboard' });
    expect(authGuard({ meta: {}, fullPath: '/x' })).toBe(true);
  });
});

describe('transactions store', () => {
  const wish = { id: 2, type: 'keinginan', status: 'terkunci' };
  const need = { id: 1, type: 'kebutuhan', status: 'aktif' };

  it('memuat, membuat, membatalkan, menghapus, dan menyaring', async () => {
    transactionsApi.list.mockResolvedValue({ transactions: [need, wish] });
    const store = useTransactionsStore();
    await store.fetchAll();
    expect(store.loaded).toBe(true);
    expect(store.lockedWishes).toEqual([wish]);

    store.setFilters({ type: 'kebutuhan' });
    expect(store.filteredItems).toEqual([need]);

    transactionsApi.create.mockResolvedValue({ transaction: { id: 3, type: 'pemasukan', status: 'aktif' }, isLocked: false });
    await store.create({});
    expect(store.items[0].id).toBe(3);

    transactionsApi.cancel.mockResolvedValue({ transaction: { ...wish, status: 'dibatalkan' } });
    await store.cancel(2);
    expect(store.lockedWishes).toHaveLength(0);

    transactionsApi.remove.mockResolvedValue({});
    await store.remove(1);
    expect(store.items.map((item) => item.id)).toEqual([3, 2]);

    store.reset();
    expect(store.items).toEqual([]);
    expect(store.filters).toEqual({ type: '', status: '' });
  });

  it('mematikan status loading meski gagal', async () => {
    transactionsApi.list.mockRejectedValue(new Error('gagal'));
    const store = useTransactionsStore();
    await expect(store.fetchAll()).rejects.toThrow('gagal');
    expect(store.loading).toBe(false);
    expect(store.loaded).toBe(false);
  });
});

describe('missions store', () => {
  it('memuat pengaturan, materi, riwayat, dan menyelesaikan sesi', async () => {
    missionsApi.settings.mockResolvedValue({ settings: { timeScale: 0.04, passingScore: 70, minPomodoroMinutesToUnlock: 25, secondsPerCard: 15 } });
    missionsApi.decks.mockResolvedValue({ decks: [{ id: 1, cards: [] }] });
    missionsApi.history.mockResolvedValue({ missions: [{ id: 9 }] });
    const store = useMissionsStore();

    await store.load();
    expect(store.ready).toBe(true);
    expect(store.settings.timeScale).toBe(0.04);
    expect(store.history).toEqual([{ id: 9 }]);

    missionsApi.start.mockResolvedValue({ session: { id: 5 } });
    expect(await store.startSession({})).toEqual({ id: 5 });

    missionsApi.complete.mockResolvedValue({ passed: true });
    expect(await store.completeSession(5, 90)).toEqual({ passed: true });
    expect(missionsApi.history).toHaveBeenCalledTimes(2);

    store.reset();
    expect(store.ready).toBe(false);
    expect(store.settings.timeScale).toBe(1);
  });
});

describe('dashboard store dan sesi', () => {
  it('memuat ringkasan dan membersihkan semua data saat sesi berakhir', async () => {
    dashboardApi.summary.mockResolvedValue({ data: { financial: {} } });
    const dashboard = useDashboardStore();
    await dashboard.fetchSummary();
    expect(dashboard.data).toEqual({ financial: {} });
    expect(dashboard.loading).toBe(false);

    const auth = useAuthStore();
    auth.token = 'tok';
    useTransactionsStore().items = [{ id: 1 }];
    endSession();
    expect(auth.isAuthenticated).toBe(false);
    expect(useTransactionsStore().items).toEqual([]);
    expect(dashboard.data).toBeNull();
  });
});

describe('useCountdown', () => {
  it('menghitung mundur sampai nol dan berhenti', async () => {
    vi.useFakeTimers();
    let countdown;
    mount({ setup() { countdown = useCountdown(); return () => null; } });
    const { remaining, start, stop } = countdown;
    start(3);
    expect(remaining.value).toBe(3);
    vi.advanceTimersByTime(1100);
    expect(remaining.value).toBe(2);
    vi.advanceTimersByTime(2500);
    expect(remaining.value).toBe(0);

    start(10);
    stop();
    stop();
    vi.advanceTimersByTime(5000);
    expect(remaining.value).toBe(10);
    await nextTick();
    vi.useRealTimers();
  });
});
