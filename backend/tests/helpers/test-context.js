import request from 'supertest';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/core/config/index.js';
import { createDatabase } from '../../src/database.js';

export const DEFAULT_START = '2026-10-20T03:00:00.000Z';

export const createTestContext = ({ env = {}, startAt = DEFAULT_START } = {}) => {
  let current = new Date(startAt);
  const clock = () => new Date(current);
  const config = loadConfig({ BCRYPT_SALT_ROUNDS: '4', AUTH_RATE_LIMIT_MAX: '1000', ...env });
  const db = createDatabase(':memory:');
  const app = createApp({ db, clock, config });

  return {
    app,
    api: request(app),
    db,
    config,
    clock,
    advanceSeconds: (seconds) => {
      current = new Date(current.getTime() + seconds * 1000);
    },
    setNow: (iso) => {
      current = new Date(iso);
    },
    close: () => db.close()
  };
};

let userCounter = 0;

export const registerUser = async (ctx, overrides = {}) => {
  userCounter += 1;
  const payload = {
    name: `Mahasiswa ${userCounter}`,
    email: `mahasiswa${userCounter}@kampus.ac.id`,
    password: 'rahasia123',
    monthly_budget: 1500000,
    ...overrides
  };
  const res = await ctx.api.post('/api/auth/register').send(payload);
  return {
    token: res.body.token,
    user: res.body.user,
    headers: { Authorization: `Bearer ${res.body.token}` }
  };
};

export const createTransaction = async (ctx, session, overrides = {}) => {
  const res = await ctx.api
    .post('/api/transactions')
    .set(session.headers)
    .send({ type: 'kebutuhan', title: 'Nasi Padang', amount: 20000, category: 'Makanan & Minuman', ...overrides });
  return res.body.transaction;
};

export const startSession = (ctx, session, body) =>
  ctx.api.post('/api/missions/sessions').set(session.headers).send(body);

export const completeSession = (ctx, session, id, body = {}) =>
  ctx.api.post(`/api/missions/sessions/${id}/complete`).set(session.headers).send(body);
