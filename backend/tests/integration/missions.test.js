import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  completeSession, createTestContext, createTransaction, registerUser, startSession
} from '../helpers/test-context.js';

let ctx;
let me;
beforeEach(async () => {
  ctx = createTestContext();
  me = await registerUser(ctx);
});
afterEach(() => ctx.close());

const createWish = (overrides = {}) =>
  createTransaction(ctx, me, { type: 'keinginan', title: 'Headset gaming', amount: 350000, category: 'Hiburan', ...overrides });

const pomodoro = (wish, extra = {}) => ({
  mission_type: 'pomodoro', subject: 'Basis Data', duration_minutes: 25, transaction_id: wish?.id, ...extra
});

describe('pengaturan dan materi', () => {
  it('menyediakan aturan misi dan deck Active Recall', async () => {
    const settings = await ctx.api.get('/api/missions/settings').set(me.headers);
    expect(settings.body.settings).toMatchObject({ timeScale: 1, passingScore: 70, minPomodoroMinutesToUnlock: 25, secondsPerCard: 15 });

    const decks = await ctx.api.get('/api/missions/active-recall/decks').set(me.headers);
    expect(decks.body.decks).toHaveLength(3);
    expect(decks.body.decks[0].cards.length).toBeGreaterThan(0);
    expect(decks.body.decks[0].cards[0]).toHaveProperty('answer');
  });

  it('semua endpoint misi membutuhkan login', async () => {
    expect((await ctx.api.get('/api/missions/history')).status).toBe(401);
    expect((await ctx.api.post('/api/missions/sessions').send({})).status).toBe(401);
  });
});

describe('Pomodoro membuka keinginan', () => {
  it('hanya terbuka setelah waktu belajar benar-benar berlalu di server', async () => {
    const wish = await createWish();
    const started = await startSession(ctx, me, pomodoro(wish));
    expect(started.status).toBe(201);
    expect(started.body.session).toMatchObject({ status: 'berjalan', required_seconds: 1500, transaction_id: wish.id });

    const tooEarly = await completeSession(ctx, me, started.body.session.id);
    expect(tooEarly.status).toBe(400);
    expect(tooEarly.body.errors.remaining_seconds).toBe(1498);

    const stillLocked = await ctx.api.get(`/api/transactions/${wish.id}`).set(me.headers);
    expect(stillLocked.body.transaction.status).toBe('terkunci');

    ctx.advanceSeconds(1500);
    const done = await completeSession(ctx, me, started.body.session.id);
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({ passed: true });
    expect(done.body.message).toContain('Headset gaming');
    expect(done.body.mission).toMatchObject({ status: 'selesai', score: 100, duration_minutes: 25, transaction_title: 'Headset gaming' });
    expect(done.body.unlockedTransaction).toMatchObject({ id: wish.id, status: 'terbuka', unlocked_at: '2026-10-20T03:25:00.000Z' });
  });

  it('sesi yang sudah selesai tidak dapat diselesaikan lagi', async () => {
    const wish = await createWish();
    const { body } = await startSession(ctx, me, pomodoro(wish));
    ctx.advanceSeconds(1500);
    await completeSession(ctx, me, body.session.id);
    expect((await completeSession(ctx, me, body.session.id)).status).toBe(409);
  });

  it('sesi belajar bebas tanpa keinginan tetap tercatat', async () => {
    const { body } = await startSession(ctx, me, pomodoro(undefined, { duration_minutes: 15 }));
    ctx.advanceSeconds(900);
    const done = await completeSession(ctx, me, body.session.id);
    expect(done.body.unlockedTransaction).toBeNull();
    expect(done.body.message).toMatch(/berhasil diselesaikan/);
  });

  it('time scale mempercepat demo tanpa melonggarkan aturan', async () => {
    const fast = createTestContext({ env: { MISSION_TIME_SCALE: '0.04' } });
    const session = await registerUser(fast);
    const wish = await createTransaction(fast, session, { type: 'keinginan', title: 'Kopi', amount: 20000 });
    const started = await startSession(fast, session, pomodoro(wish));
    expect(started.body.session.required_seconds).toBe(60);

    expect((await completeSession(fast, session, started.body.session.id)).status).toBe(400);
    fast.advanceSeconds(60);
    expect((await completeSession(fast, session, started.body.session.id)).status).toBe(200);
    fast.close();
  });

  it('keinginan yang dibatalkan atau dihapus saat sesi berjalan tidak ikut terbuka', async () => {
    const cancelledWish = await createWish({ title: 'Dibatalkan' });
    const deletedWish = await createWish({ title: 'Dihapus' });
    const a = await startSession(ctx, me, pomodoro(cancelledWish));
    const b = await startSession(ctx, me, pomodoro(deletedWish));
    await ctx.api.post(`/api/transactions/${cancelledWish.id}/cancel`).set(me.headers);
    await ctx.api.delete(`/api/transactions/${deletedWish.id}`).set(me.headers);

    ctx.advanceSeconds(1500);
    const doneA = await completeSession(ctx, me, a.body.session.id);
    const doneB = await completeSession(ctx, me, b.body.session.id);
    expect(doneA.body.unlockedTransaction).toBeNull();
    expect(doneB.body.unlockedTransaction).toBeNull();
    expect((await ctx.api.get(`/api/transactions/${cancelledWish.id}`).set(me.headers)).body.transaction.status).toBe('dibatalkan');
  });
});

describe('Active Recall membuka keinginan', () => {
  const recall = (wish, extra = {}) => ({ mission_type: 'active_recall', deck_id: 1, transaction_id: wish?.id, ...extra });

  it('skor di bawah batas lulus menggagalkan sesi dan keinginan tetap terkunci', async () => {
    const wish = await createWish({ mission_type: 'active_recall' });
    const { body } = await startSession(ctx, me, recall(wish));
    expect(body.session).toMatchObject({ required_seconds: 45, subject: 'Pemrograman Web & Clean Architecture' });

    ctx.advanceSeconds(45);
    const failed = await completeSession(ctx, me, body.session.id, { score: 60 });
    expect(failed.status).toBe(200);
    expect(failed.body).toMatchObject({ passed: false, unlockedTransaction: null });
    expect(failed.body.message).toMatch(/batas lulus 70/);
    expect(failed.body.mission.status).toBe('gagal');
    expect((await ctx.api.get(`/api/transactions/${wish.id}`).set(me.headers)).body.transaction.status).toBe('terkunci');
  });

  it('skor lulus membuka keinginan dan mencatat durasi nyata', async () => {
    const wish = await createWish({ mission_type: 'active_recall' });
    const { body } = await startSession(ctx, me, recall(wish));
    ctx.advanceSeconds(100);
    const done = await completeSession(ctx, me, body.session.id, { score: '90' });
    expect(done.body).toMatchObject({ passed: true });
    expect(done.body.mission).toMatchObject({ status: 'selesai', score: 90, duration_minutes: 2 });
    expect(done.body.unlockedTransaction.status).toBe('terbuka');
  });

  it('durasi tercatat minimal 1 menit', async () => {
    const { body } = await startSession(ctx, me, recall(undefined));
    ctx.advanceSeconds(45);
    const done = await completeSession(ctx, me, body.session.id, { score: 100 });
    expect(done.body.mission.duration_minutes).toBe(1);
  });

  it('mewajibkan skor dan waktu minimum membaca kartu', async () => {
    const { body } = await startSession(ctx, me, recall(undefined));
    expect((await completeSession(ctx, me, body.session.id, { score: 100 })).status).toBe(400);

    ctx.advanceSeconds(45);
    const noScore = await completeSession(ctx, me, body.session.id, {});
    expect(noScore.status).toBe(400);
    expect(noScore.body.errors.score).toBeDefined();
  });
});

describe('penolakan saat memulai sesi', () => {
  it('memvalidasi body', async () => {
    const res = await startSession(ctx, me, { mission_type: 'meditasi' });
    expect(res.status).toBe(400);
    expect(res.body.errors.mission_type).toBeDefined();
  });

  it('menolak keinginan yang tidak ada atau milik orang lain', async () => {
    const other = await registerUser(ctx);
    const foreign = await createTransaction(ctx, other, { type: 'keinginan', title: 'Punya orang', amount: 1000 });
    expect((await startSession(ctx, me, pomodoro({ id: 9999 }))).status).toBe(404);
    expect((await startSession(ctx, me, pomodoro(foreign))).status).toBe(404);
  });

  it('menolak transaksi yang tidak layak dibuka', async () => {
    const need = await createTransaction(ctx, me);
    expect((await startSession(ctx, me, pomodoro(need))).status).toBe(400);

    const wish = await createWish();
    await ctx.api.post(`/api/transactions/${wish.id}/cancel`).set(me.headers);
    expect((await startSession(ctx, me, pomodoro(wish))).status).toBe(400);
  });

  it('menolak jenis misi yang tidak sesuai pilihan keinginan', async () => {
    const wish = await createWish({ mission_type: 'active_recall' });
    const res = await startSession(ctx, me, pomodoro(wish));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Active Recall/);
  });

  it('mewajibkan Pomodoro minimal 25 menit untuk membuka keinginan', async () => {
    const wish = await createWish();
    const res = await startSession(ctx, me, pomodoro(wish, { duration_minutes: 15 }));
    expect(res.status).toBe(400);
    expect(res.body.errors.duration_minutes).toBeDefined();
  });

  it('menolak deck yang tidak ada', async () => {
    const res = await startSession(ctx, me, { mission_type: 'active_recall', deck_id: 999 });
    expect(res.status).toBe(404);
  });
});

describe('penolakan saat menyelesaikan sesi', () => {
  it('menolak id tidak valid, sesi tidak ada, dan sesi milik orang lain', async () => {
    const { body } = await startSession(ctx, me, pomodoro(undefined));
    const other = await registerUser(ctx);

    expect((await completeSession(ctx, me, 'abc')).status).toBe(400);
    expect((await completeSession(ctx, me, 9999)).status).toBe(404);
    expect((await completeSession(ctx, other, body.session.id)).status).toBe(404);
  });

  it('menolak skor di luar rentang', async () => {
    const { body } = await startSession(ctx, me, pomodoro(undefined));
    expect((await completeSession(ctx, me, body.session.id, { score: 150 })).status).toBe(400);
  });
});

describe('riwayat misi', () => {
  it('menampilkan sesi selesai dan gagal, tanpa sesi yang masih berjalan', async () => {
    const wish = await createWish();
    const finished = await startSession(ctx, me, pomodoro(wish));
    await startSession(ctx, me, pomodoro(undefined));
    ctx.advanceSeconds(1500);
    await completeSession(ctx, me, finished.body.session.id);

    const res = await ctx.api.get('/api/missions/history').set(me.headers);
    expect(res.body.count).toBe(1);
    expect(res.body.missions[0]).toMatchObject({ status: 'selesai', transaction_title: 'Headset gaming' });
  });
});

describe('Active Recall dengan AI dan materi kustom', () => {
  it('dapat menghasilkan kuis dari materi menggunakan AI dan menyimpannya sebagai deck', async () => {
    const res = await ctx.api
      .post('/api/missions/active-recall/generate')
      .set(me.headers)
      .send({
        title: 'Normalisasi Basis Data',
        subject: 'Basis Data',
        content: 'Normalisasi adalah proses pengorganisasian data untuk menghindari redundansi dan anomali. 1NF mensyaratkan setiap atribut bernilai atomik.',
        card_count: 2,
        save_as_deck: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.deck).toMatchObject({
      title: 'Normalisasi Basis Data',
      subject: 'Basis Data'
    });
    expect(res.body.deck.cards).toHaveLength(2);

    const customDeckId = res.body.deck.id;

    // Masuk dalam daftar deck milik user
    const listRes = await ctx.api.get('/api/missions/active-recall/decks').set(me.headers);
    expect(listRes.body.decks.some((d) => d.id === customDeckId)).toBe(true);

    // Dapat dihapus oleh pemiliknya
    const delRes = await ctx.api.delete(`/api/missions/active-recall/decks/${customDeckId}`).set(me.headers);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('dapat membuat deck kustom secara langsung', async () => {
    const res = await ctx.api
      .post('/api/missions/active-recall/decks')
      .set(me.headers)
      .send({
        title: 'Algoritma Pencarian',
        subject: 'Struktur Data',
        cards: [
          { question: 'Apa kompleksitas Binary Search?', answer: 'O(log n)', explanation: 'Membagi rentang pencarian menjadi dua pada tiap iterasi.' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.deck.cards).toHaveLength(1);
  });
});
