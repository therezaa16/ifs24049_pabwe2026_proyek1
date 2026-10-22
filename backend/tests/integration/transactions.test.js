import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SqliteTransactionRepository } from '../../src/features/transactions/infrastructure/transaction.repository.js';
import { createTestContext, createTransaction, registerUser } from '../helpers/test-context.js';

let ctx;
let me;
beforeEach(async () => {
  ctx = createTestContext();
  me = await registerUser(ctx);
});
afterEach(() => ctx.close());

const post = (body, session = me) => ctx.api.post('/api/transactions').set(session.headers).send(body);

describe('POST /api/transactions', () => {
  it('mencatat pemasukan dan kebutuhan langsung berstatus aktif', async () => {
    const income = await post({ type: 'pemasukan', title: 'Kiriman orang tua', amount: '1500000', category: 'Uang Saku' });
    expect(income.status).toBe(201);
    expect(income.body).toMatchObject({ isLocked: false, message: 'Transaksi berhasil dicatat' });
    expect(income.body.transaction).toMatchObject({ status: 'aktif', mission_type: null, amount: 1500000, unlocked_at: null });

    const need = await post({ type: 'kebutuhan', title: 'Fotokopi', amount: 15000, category: 'Kuliah', note: 'Modul PABWE' });
    expect(need.body.transaction).toMatchObject({ status: 'aktif', note: 'Modul PABWE' });
  });

  it('keinginan tidak langsung berlaku: berstatus TERKUNCI dengan misi pilihan', async () => {
    const res = await post({ type: 'keinginan', title: 'Boba', amount: 28000, category: 'Hiburan', mission_type: 'active_recall' });
    expect(res.status).toBe(201);
    expect(res.body.isLocked).toBe(true);
    expect(res.body.message).toMatch(/TERKUNCI/);
    expect(res.body.transaction).toMatchObject({ status: 'terkunci', mission_type: 'active_recall' });

    const defaultMission = await post({ type: 'keinginan', title: 'Kopi', amount: 20000, category: 'Hiburan' });
    expect(defaultMission.body.transaction.mission_type).toBe('pomodoro');
  });

  it('menolak input tidak valid dan permintaan tanpa login', async () => {
    const bad = await post({ type: 'hadiah', title: '', amount: -5, category: '' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.errors)).toEqual(['title', 'type', 'amount', 'category']);
    expect((await ctx.api.post('/api/transactions').send({})).status).toBe(401);
  });
});

describe('GET /api/transactions', () => {
  beforeEach(async () => {
    await createTransaction(ctx, me, { type: 'pemasukan', title: 'Gaji asisten', amount: 500000, category: 'Pendapatan' });
    await createTransaction(ctx, me, { type: 'kebutuhan', title: 'Makan siang', amount: 18000 });
    ctx.advanceSeconds(60);
    await createTransaction(ctx, me, { type: 'keinginan', title: 'Nonton', amount: 50000, category: 'Hiburan' });
  });

  it('mengurutkan dari yang terbaru dan hanya milik pengguna sendiri', async () => {
    const other = await registerUser(ctx);
    await createTransaction(ctx, other, { title: 'Milik orang lain' });

    const res = await ctx.api.get('/api/transactions').set(me.headers);
    expect(res.body.count).toBe(3);
    expect(res.body.transactions[0].title).toBe('Nonton');
  });

  it('menyaring berdasarkan tipe, status, atau keduanya', async () => {
    const byType = await ctx.api.get('/api/transactions?type=kebutuhan').set(me.headers);
    expect(byType.body.count).toBe(1);

    const byStatus = await ctx.api.get('/api/transactions?status=terkunci').set(me.headers);
    expect(byStatus.body.transactions.map((t) => t.title)).toEqual(['Nonton']);

    const both = await ctx.api.get('/api/transactions?type=keinginan&status=aktif').set(me.headers);
    expect(both.body.count).toBe(0);
  });

  it('menolak filter yang tidak dikenal', async () => {
    const res = await ctx.api.get('/api/transactions?type=ngawur&status=aneh').set(me.headers);
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(['type', 'status']);
  });
});

describe('detail, batal, dan hapus', () => {
  it('menampilkan detail milik sendiri dan menyembunyikan milik orang lain', async () => {
    const tx = await createTransaction(ctx, me);
    expect((await ctx.api.get(`/api/transactions/${tx.id}`).set(me.headers)).body.transaction.title).toBe('Nasi Padang');

    const other = await registerUser(ctx);
    expect((await ctx.api.get(`/api/transactions/${tx.id}`).set(other.headers)).status).toBe(404);
    expect((await ctx.api.get('/api/transactions/9999').set(me.headers)).status).toBe(404);
    expect((await ctx.api.get('/api/transactions/abc').set(me.headers)).status).toBe(400);
  });

  it('membatalkan keinginan terkunci sekali saja', async () => {
    const want = await createTransaction(ctx, me, { type: 'keinginan', title: 'Skin game', amount: 100000 });
    const cancelled = await ctx.api.post(`/api/transactions/${want.id}/cancel`).set(me.headers);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.transaction.status).toBe('dibatalkan');

    expect((await ctx.api.post(`/api/transactions/${want.id}/cancel`).set(me.headers)).status).toBe(400);
  });

  it('menolak pembatalan kebutuhan dan transaksi yang tidak ada', async () => {
    const need = await createTransaction(ctx, me);
    expect((await ctx.api.post(`/api/transactions/${need.id}/cancel`).set(me.headers)).status).toBe(400);
    expect((await ctx.api.post('/api/transactions/9999/cancel').set(me.headers)).status).toBe(404);
  });

  it('menghapus transaksi milik sendiri saja', async () => {
    const tx = await createTransaction(ctx, me);
    const other = await registerUser(ctx);
    expect((await ctx.api.delete(`/api/transactions/${tx.id}`).set(other.headers)).status).toBe(404);
    expect((await ctx.api.delete(`/api/transactions/${tx.id}`).set(me.headers)).status).toBe(200);
    expect((await ctx.api.delete(`/api/transactions/${tx.id}`).set(me.headers)).status).toBe(404);
  });
});

describe('SqliteTransactionRepository', () => {
  it('findAll tanpa filter dan transisi status bersyarat', async () => {
    const repo = new SqliteTransactionRepository({ db: ctx.db, clock: ctx.clock });
    const need = await createTransaction(ctx, me);
    const want = await createTransaction(ctx, me, { type: 'keinginan', title: 'Hoodie', amount: 200000 });

    expect(repo.findAll(me.user.id)).toHaveLength(2);
    expect(repo.markUnlocked(need.id, me.user.id, ctx.clock().toISOString())).toBe(false);
    expect(repo.markCancelled(need.id, me.user.id)).toBe(false);
    expect(repo.markUnlocked(want.id, me.user.id, ctx.clock().toISOString())).toBe(true);
    expect(repo.markUnlocked(want.id, me.user.id, ctx.clock().toISOString())).toBe(false);
    expect(repo.markCancelled(want.id, me.user.id)).toBe(false);
  });
});
