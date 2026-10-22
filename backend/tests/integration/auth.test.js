import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../src/core/errors/app-error.js';
import { SqliteUserRepository } from '../../src/features/auth/infrastructure/user.repository.js';
import { createTestContext, registerUser } from '../helpers/test-context.js';

let ctx;
beforeEach(() => { ctx = createTestContext(); });
afterEach(() => ctx.close());

const payload = { name: '  Eliza Rajagukguk ', email: 'Eliza@Del.ac.id', password: 'rahasia123', monthly_budget: 1500000 };

describe('POST /api/auth/register', () => {
  it('mendaftarkan pengguna, menormalkan data, dan tidak membocorkan password', async () => {
    const res = await ctx.api.post('/api/auth/register').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Eliza Rajagukguk', email: 'eliza@del.ac.id', monthly_budget: 1500000 });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.created_at).toBe('2026-10-20T03:00:00.000Z');
  });

  it('memberi anggaran 0 bila tidak diisi', async () => {
    const withoutBudget = await ctx.api.post('/api/auth/register').send({ ...payload, monthly_budget: undefined });
    expect(withoutBudget.body.user.monthly_budget).toBe(0);
    const nullBudget = await ctx.api.post('/api/auth/register').send({ ...payload, email: 'lain@del.ac.id', monthly_budget: null });
    expect(nullBudget.body.user.monthly_budget).toBe(0);
  });

  it('menolak email ganda tanpa membedakan huruf besar/kecil', async () => {
    await ctx.api.post('/api/auth/register').send(payload);
    const res = await ctx.api.post('/api/auth/register').send({ ...payload, email: 'ELIZA@del.ac.id' });
    expect(res.status).toBe(409);
  });

  it('menolak input tidak valid', async () => {
    const res = await ctx.api.post('/api/auth/register').send({ name: '', email: 'x', password: '1' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors)).toEqual(['name', 'email', 'password']);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => ctx.api.post('/api/auth/register').send(payload));

  it('berhasil dengan kredensial benar', async () => {
    const res = await ctx.api.post('/api/auth/login').send({ email: ' ELIZA@del.ac.id ', password: 'rahasia123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('eliza@del.ac.id');
  });

  it('menolak password salah dan email tidak dikenal dengan pesan yang sama', async () => {
    const wrongPassword = await ctx.api.post('/api/auth/login').send({ email: 'eliza@del.ac.id', password: 'salahsalah' });
    const unknownEmail = await ctx.api.post('/api/auth/login').send({ email: 'x@del.ac.id', password: 'rahasia123' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('menolak body kosong', async () => {
    const res = await ctx.api.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('profil dan anggaran', () => {
  it('GET /me mengembalikan profil pengguna login', async () => {
    const session = await registerUser(ctx);
    const res = await ctx.api.get('/api/auth/me').set(session.headers);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(session.user.id);
  });

  it('GET /me menolak permintaan tanpa token', async () => {
    expect((await ctx.api.get('/api/auth/me')).status).toBe(401);
  });

  it('PATCH /budget memperbarui anggaran dan memvalidasi input', async () => {
    const session = await registerUser(ctx);
    const ok = await ctx.api.patch('/api/auth/budget').set(session.headers).send({ monthly_budget: '2000000' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.monthly_budget).toBe(2000000);

    const bad = await ctx.api.patch('/api/auth/budget').set(session.headers).send({ monthly_budget: -1 });
    expect(bad.status).toBe(400);
  });

  it('token milik pengguna yang sudah dihapus ditolak', async () => {
    const session = await registerUser(ctx);
    ctx.db.prepare('DELETE FROM users WHERE id = ?').run(session.user.id);
    expect((await ctx.api.get('/api/auth/me').set(session.headers)).status).toBe(401);
  });
});

describe('SqliteUserRepository', () => {
  it('mengubah pelanggaran UNIQUE menjadi ConflictError dan meneruskan error lain', () => {
    const repo = new SqliteUserRepository({ db: ctx.db, clock: ctx.clock });
    const base = { name: 'A', email: 'a@x.id', password: 'h', monthlyBudget: 0 };
    repo.create(base);
    expect(() => repo.create({ ...base, email: 'A@X.ID' })).toThrow(ConflictError);
    expect(() => repo.create({ ...base, email: 'b@x.id', name: null })).toThrow(/NOT NULL/);
  });

  it('GetProfile melaporkan pengguna yang tidak ada', async () => {
    const { GetProfile } = await import('../../src/features/auth/application/get-profile.js');
    const repo = new SqliteUserRepository({ db: ctx.db, clock: ctx.clock });
    expect(() => new GetProfile({ userRepository: repo }).execute({ userId: 999 })).toThrow(/tidak ditemukan/);
  });
});
