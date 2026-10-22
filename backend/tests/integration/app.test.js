import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedActiveRecallDecks } from '../../src/features/study-missions/index.js';
import { createTestContext, registerUser } from '../helpers/test-context.js';

let ctx;
afterEach(() => ctx.close());

describe('aplikasi', () => {
  beforeEach(() => {
    ctx = createTestContext({ env: { CORS_ORIGIN: 'http://localhost:5173' } });
  });

  it('health check mengembalikan status ok tanpa header x-powered-by', async () => {
    const res = await ctx.api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', timestamp: '2026-10-20T03:00:00.000Z' });
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('mengizinkan origin yang dikonfigurasi', async () => {
    const res = await ctx.api.get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('menjawab 404 JSON untuk rute yang tidak ada', async () => {
    const res = await ctx.api.get('/api/tidak-ada');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.message).toContain('/api/tidak-ada');
  });

  it('menolak JSON rusak dan body terlalu besar', async () => {
    const malformed = await ctx.api.post('/api/auth/login').set('Content-Type', 'application/json').send('{rusak');
    expect(malformed.status).toBe(400);

    const huge = await ctx.api.post('/api/auth/login').send({ email: 'x'.repeat(200_000) });
    expect(huge.status).toBe(413);
  });

  it('endpoint unlock langsung tidak ada: keinginan hanya dibuka lewat misi', async () => {
    const session = await registerUser(ctx);
    const created = await ctx.api.post('/api/transactions').set(session.headers)
      .send({ type: 'keinginan', title: 'Sepatu baru', amount: 500000, category: 'Fashion' });
    const res = await ctx.api.post(`/api/transactions/${created.body.transaction.id}/unlock`).set(session.headers);
    expect(res.status).toBe(404);
  });

  it('seed deck bersifat idempoten', () => {
    const count = () => ctx.db.prepare('SELECT COUNT(*) AS n FROM active_recall_decks').get().n;
    expect(count()).toBe(3);
    seedActiveRecallDecks(ctx.db);
    expect(count()).toBe(3);
  });
});

describe('pembatasan laju autentikasi', () => {
  it('mengembalikan 429 setelah batas terlampaui', async () => {
    ctx = createTestContext({ env: { AUTH_RATE_LIMIT_MAX: '2' } });
    const attempt = () => ctx.api.post('/api/auth/login').send({ email: 'a@b.co', password: 'salah123' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });
});
