import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { ApiError } from '@/core/http/api-error.js';
import ActiveRecallPanel from '@/features/study-missions/presentation/ActiveRecallPanel.vue';
import LoginView from '@/features/auth/presentation/LoginView.vue';
import PomodoroPanel from '@/features/study-missions/presentation/PomodoroPanel.vue';
import TransactionRow from '@/features/transactions/presentation/TransactionRow.vue';
import { useMissionsStore } from '@/features/study-missions/application/missions.store.js';
import { authApi } from '@/features/auth/infrastructure/auth.api.js';
import { missionsApi } from '@/features/study-missions/infrastructure/missions.api.js';

vi.mock('@/features/auth/infrastructure/auth.api.js', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), updateBudget: vi.fn() }
}));
vi.mock('@/features/study-missions/infrastructure/missions.api.js', () => ({
  missionsApi: { settings: vi.fn(), decks: vi.fn(), history: vi.fn(), start: vi.fn(), complete: vi.fn() }
}));

const buildRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<p>home</p>' } },
    { path: '/misi', component: { template: '<p>misi</p>' } },
    { path: '/masuk', component: LoginView },
    { path: '/daftar', component: { template: '<p>daftar</p>' } }
  ]
});

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

describe('LoginView', () => {
  const mountLogin = async () => {
    const router = buildRouter();
    router.push('/masuk');
    await router.isReady();
    const wrapper = mount(LoginView, { global: { plugins: [router] } });
    return { router, wrapper };
  };

  it('menampilkan error validasi tanpa memanggil API', async () => {
    const { wrapper } = await mountLogin();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('Masukkan alamat email yang valid');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('login berhasil mengarahkan ke beranda', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user: { id: 1 } });
    const { wrapper, router } = await mountLogin();
    await wrapper.find('#email').setValue('eliza@del.ac.id');
    await wrapper.find('#password').setValue('rahasia123');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authApi.login).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('menampilkan pesan server saat login gagal', async () => {
    authApi.login.mockRejectedValue(new ApiError('Email atau password salah', 401));
    const { wrapper } = await mountLogin();
    await wrapper.find('#email').setValue('eliza@del.ac.id');
    await wrapper.find('#password').setValue('salah');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toBe('Email atau password salah');
  });
});

describe('TransactionRow', () => {
  const mountRow = (transaction) => {
    const router = buildRouter();
    return mount(TransactionRow, { props: { transaction }, global: { plugins: [router] } });
  };
  const base = { id: 7, title: 'Skin game', amount: 50000, category: 'Hiburan', note: '', created_at: '2026-10-20T03:00:00.000Z' };

  it('keinginan terkunci menawarkan misi dan pembatalan', async () => {
    const wrapper = mountRow({ ...base, type: 'keinginan', status: 'terkunci', mission_type: 'pomodoro' });
    expect(wrapper.text()).toContain('Terkunci');
    expect(wrapper.text()).toContain('Buka lewat misi');
    expect(wrapper.text()).toContain('Misi Pomodoro');

    await wrapper.findAll('button').find((button) => button.text() === 'Batalkan').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    await wrapper.find('button[aria-label="Hapus Skin game"]').trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('kebutuhan tercatat tidak menampilkan aksi buka misi', () => {
    const wrapper = mountRow({ ...base, type: 'kebutuhan', status: 'aktif', mission_type: null, note: 'Modul' });
    expect(wrapper.text()).not.toContain('Buka lewat misi');
    expect(wrapper.text()).toContain('Modul');
    expect(wrapper.text()).toContain('−');
  });
});

describe('PomodoroPanel', () => {
  const seedSettings = () => {
    const missions = useMissionsStore();
    missions.settings = { timeScale: 0.04, passingScore: 70, minPomodoroMinutesToUnlock: 25, secondsPerCard: 15 };
  };

  it('memvalidasi topik, menjalankan timer, lalu mengklaim hasil', async () => {
    vi.useFakeTimers();
    seedSettings();
    missionsApi.start.mockResolvedValue({ session: { id: 11, subject: 'Basis Data', required_seconds: 3 } });
    missionsApi.complete.mockResolvedValue({ passed: true, unlockedTransaction: { id: 1 } });
    missionsApi.history.mockResolvedValue({ missions: [] });

    const wrapper = mount(PomodoroPanel, { props: { wish: { id: 1, category: 'Kuliah' } } });
    const start = () => wrapper.findAll('button').find((button) => button.text().includes('Mulai fokus'));

    await start().trigger('click');
    expect(wrapper.text()).toContain('Isi mata kuliah');
    expect(missionsApi.start).not.toHaveBeenCalled();

    const fifteen = wrapper.findAll('.preset').find((button) => button.text().includes('15'));
    expect(fifteen.attributes('disabled')).toBeDefined();

    await wrapper.find('#subject').setValue('Basis Data');
    await start().trigger('click');
    await flushPromises();
    expect(missionsApi.start).toHaveBeenCalledWith(expect.objectContaining({ missionType: 'pomodoro', durationMinutes: 25, transactionId: 1 }));
    expect(wrapper.find('.clock').text()).toBe('00:03');
    expect(wrapper.text()).not.toContain('Selesai & buka keinginan');

    vi.advanceTimersByTime(3500);
    await flushPromises();
    expect(wrapper.text()).toContain('Selesai & buka keinginan');

    await wrapper.findAll('button').find((button) => button.text().includes('Selesai & buka')).trigger('click');
    await flushPromises();
    expect(missionsApi.complete).toHaveBeenCalledWith(11, undefined);
    expect(wrapper.emitted('completed')[0][0].unlockedTransaction.id).toBe(1);
  });

  it('server menolak terlalu cepat: timer dilanjutkan dengan sisa waktu dari server', async () => {
    vi.useFakeTimers();
    seedSettings();
    missionsApi.start.mockResolvedValue({ session: { id: 12, subject: 'Jaringan', required_seconds: 1 } });
    missionsApi.complete.mockRejectedValue(new ApiError('Waktu belajar belum cukup', 400, { remaining_seconds: 4 }));

    const wrapper = mount(PomodoroPanel, { props: { wish: null, subjectSuggestion: 'Jaringan' } });
    await wrapper.findAll('button').find((button) => button.text().includes('Mulai fokus')).trigger('click');
    await flushPromises();
    vi.advanceTimersByTime(1500);
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text().includes('Selesaikan misi')).trigger('click');
    await flushPromises();

    expect(wrapper.find('.clock').text()).toBe('00:05');
    expect(wrapper.emitted('completed')).toBeUndefined();
  });

  it('dapat dibatalkan sebelum selesai', async () => {
    seedSettings();
    missionsApi.start.mockResolvedValue({ session: { id: 13, subject: 'X', required_seconds: 60 } });
    const wrapper = mount(PomodoroPanel, { props: { subjectSuggestion: 'Aljabar' } });
    await wrapper.findAll('button').find((button) => button.text().includes('Mulai fokus')).trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === 'Batalkan sesi').trigger('click');
    expect(wrapper.find('#subject').exists()).toBe(true);
  });
});

describe('ActiveRecallPanel', () => {
  it('mengulas kartu, menghitung skor, lalu mengirim hasil ke server', async () => {
    vi.useFakeTimers();
    const missions = useMissionsStore();
    missions.settings = { timeScale: 1, passingScore: 70, minPomodoroMinutesToUnlock: 25, secondsPerCard: 15 };
    missions.decks = [{
      id: 1, title: 'Deck A', description: 'Uji', subject: 'X',
      cards: [
        { id: 1, question: 'Q1?', answer: 'A1', explanation: 'E1' },
        { id: 2, question: 'Q2?', answer: 'A2', explanation: null }
      ]
    }];
    missionsApi.start.mockResolvedValue({ session: { id: 21, subject: 'Deck A', required_seconds: 2 } });
    missionsApi.complete.mockResolvedValue({ passed: true, unlockedTransaction: null });
    missionsApi.history.mockResolvedValue({ missions: [] });

    const wrapper = mount(ActiveRecallPanel, { props: { wish: null } });
    await wrapper.findAll('button').find((button) => button.text().includes('Mulai sesi kartu')).trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Q1?');
    expect(wrapper.text()).not.toContain('A1');

    for (const label of ['Ingat', 'Ingat']) {
      await wrapper.findAll('button').find((button) => button.text().includes('Tampilkan jawaban')).trigger('click');
      await wrapper.findAll('.rating').find((button) => button.text().startsWith(label)).trigger('click');
    }
    expect(wrapper.find('.score').text()).toBe('100');

    vi.advanceTimersByTime(2500);
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text().includes('Kirim hasil')).trigger('click');
    await flushPromises();

    expect(missionsApi.complete).toHaveBeenCalledWith(21, 100);
    expect(wrapper.emitted('completed')).toHaveLength(1);
  });

  it('skor rendah memberi peringatan, dan sesi bisa diulang dari awal', async () => {
    vi.useFakeTimers();
    const missions = useMissionsStore();
    missions.settings = { timeScale: 1, passingScore: 70, minPomodoroMinutesToUnlock: 25, secondsPerCard: 15 };
    missions.decks = [{ id: 1, title: 'Deck A', description: 'Uji', subject: 'X', cards: [{ id: 1, question: 'Q1?', answer: 'A1', explanation: '' }] }];
    missionsApi.start.mockResolvedValue({ session: { id: 22, subject: 'Deck A', required_seconds: 30 } });

    const wrapper = mount(ActiveRecallPanel, { props: { wish: null } });
    await wrapper.findAll('button').find((button) => button.text().includes('Mulai sesi kartu')).trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text().includes('Tampilkan jawaban')).trigger('click');
    await wrapper.findAll('.rating').find((button) => button.text().startsWith('Lupa')).trigger('click');

    expect(wrapper.text()).toContain('Di bawah batas lulus 70');
    expect(wrapper.findAll('button').find((button) => button.text().includes('Kirim hasil')).attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('00:30');

    await wrapper.findAll('button').find((button) => button.text().includes('Ulangi dari awal')).trigger('click');
    expect(wrapper.text()).toContain('Pilih materi kartu');
  });
});
