import { EventEmitter } from 'node:events';
import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { config as defaultConfig, loadConfig } from '../../src/core/config/index.js';
import { openDatabase, runInTransaction } from '../../src/core/database/connection.js';
import {
  AppError, ConflictError, NotFoundError, TooManyRequestsError, UnauthorizedError, ValidationError
} from '../../src/core/errors/app-error.js';
import { asyncHandler } from '../../src/core/middleware/async-handler.js';
import { createAuthenticate } from '../../src/core/middleware/auth.middleware.js';
import { errorHandler } from '../../src/core/middleware/error.middleware.js';
import { createRateLimiter } from '../../src/core/middleware/rate-limit.middleware.js';
import { validate } from '../../src/core/middleware/validation.middleware.js';
import { createPasswordHasher } from '../../src/core/security/password-hasher.js';
import { createTokenService } from '../../src/core/security/token-service.js';
import { parseIdParam } from '../../src/core/utils/params.js';
import {
  hasErrors, isNonBlankString, isNonNegativeNumber, isPositiveInteger, toNumberOrNaN
} from '../../src/core/utils/validation.js';
import { MISSION_TYPES, MISSION_TYPE_VALUES } from '../../src/core/domain/mission-types.js';

afterEach(() => vi.restoreAllMocks());

describe('config', () => {
  it('memakai nilai bawaan yang aman untuk pengembangan', () => {
    const cfg = loadConfig({});
    expect(cfg).toMatchObject({
      nodeEnv: 'development', port: 5000, jwtExpiresIn: '7d', bcryptSaltRounds: 10,
      corsOrigin: '*', timezoneOffsetMinutes: 420, missionTimeScale: 1
    });
    expect(cfg.jwtSecret).toBeTruthy();
    expect(cfg.dbPath).toBe('disiplin_finansial.sqlite');
    expect(cfg.authRateLimit).toEqual({ windowMs: 900000, max: 30 });
    expect(Object.isFrozen(cfg)).toBe(true);
  });

  it('membaca variabel lingkungan dan menormalkan daftar origin', () => {
    const cfg = loadConfig({
      NODE_ENV: 'production', JWT_SECRET: 's3cret', PORT: '8080', JWT_EXPIRES_IN: '1d', DB_PATH: 'x.sqlite',
      BCRYPT_SALT_ROUNDS: '12', CORS_ORIGIN: 'http://a.test, http://b.test,', TIMEZONE_OFFSET_MINUTES: '-60',
      MISSION_TIME_SCALE: '0.04', AUTH_RATE_LIMIT_WINDOW_MS: '1000', AUTH_RATE_LIMIT_MAX: '5'
    });
    expect(cfg).toMatchObject({
      nodeEnv: 'production', jwtSecret: 's3cret', port: 8080, jwtExpiresIn: '1d', dbPath: 'x.sqlite',
      bcryptSaltRounds: 12, corsOrigin: ['http://a.test', 'http://b.test'], timezoneOffsetMinutes: -60,
      missionTimeScale: 0.04, authRateLimit: { windowMs: 1000, max: 5 }
    });
  });

  it('kembali ke nilai bawaan saat angka tidak valid', () => {
    const cfg = loadConfig({ PORT: 'abc', MISSION_TIME_SCALE: '0' });
    expect(cfg.port).toBe(5000);
    expect(cfg.missionTimeScale).toBe(1);
  });

  it('menolak production tanpa JWT_SECRET', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow('JWT_SECRET');
  });

  it('membaca process.env bila tanpa argumen dan mengekspor config bawaan', () => {
    expect(loadConfig().port).toBeGreaterThanOrEqual(0);
    expect(defaultConfig.jwtSecret).toBeTruthy();
  });
});

describe('errors dan konstanta', () => {
  it('menyediakan status dan pesan bawaan', () => {
    expect(new AppError('x')).toMatchObject({ statusCode: 500, errors: null, name: 'AppError' });
    expect(new ValidationError()).toMatchObject({ statusCode: 400, message: 'Validasi gagal' });
    expect(new UnauthorizedError()).toMatchObject({ statusCode: 401 });
    expect(new NotFoundError()).toMatchObject({ statusCode: 404 });
    expect(new ConflictError()).toMatchObject({ statusCode: 409 });
    expect(new TooManyRequestsError()).toMatchObject({ statusCode: 429 });
    expect(new ValidationError('m', { a: 1 }).errors).toEqual({ a: 1 });
    expect(new UnauthorizedError('k').message).toBe('k');
    expect(new NotFoundError('n').message).toBe('n');
    expect(new ConflictError('c').message).toBe('c');
    expect(new TooManyRequestsError('t').message).toBe('t');
  });

  it('mengekspor tipe misi', () => {
    expect(MISSION_TYPE_VALUES).toEqual([MISSION_TYPES.POMODORO, MISSION_TYPES.ACTIVE_RECALL]);
  });
});

describe('validation utils', () => {
  it('memeriksa string, angka, dan integer', () => {
    expect(isNonBlankString('a')).toBe(true);
    expect(isNonBlankString('  ')).toBe(false);
    expect(isNonBlankString(5)).toBe(false);
    expect(toNumberOrNaN(5)).toBe(5);
    expect(toNumberOrNaN('7')).toBe(7);
    expect(toNumberOrNaN(' ')).toBeNaN();
    expect(toNumberOrNaN(null)).toBeNaN();
    expect(isPositiveInteger('3')).toBe(true);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber('abc')).toBe(false);
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ a: 'x' })).toBe(true);
  });
});

describe('parseIdParam', () => {
  it('menerima bilangan bulat positif', () => {
    expect(parseIdParam('12', 'ID x')).toBe(12);
    expect(parseIdParam(3)).toBe(3);
  });

  it.each(['0', 'abc', '12abc', '-1', '1.5', '99999999999999999999'])('menolak %s', (raw) => {
    expect(() => parseIdParam(raw, 'ID x')).toThrow('ID x tidak valid');
  });

  it('memakai label bawaan', () => {
    expect(() => parseIdParam('x')).toThrow('ID tidak valid');
  });
});

describe('middleware', () => {
  const buildRes = () => {
    const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
    return res;
  };

  it('asyncHandler meneruskan error ke next', async () => {
    const next = vi.fn();
    const error = new Error('gagal');
    await asyncHandler(async () => { throw error; })({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);

    const ok = vi.fn();
    await asyncHandler(async () => 'ok')({}, {}, ok);
    expect(ok).not.toHaveBeenCalled();
  });

  it('validate memanggil next dengan atau tanpa error', () => {
    const next = vi.fn();
    validate(() => ({}))({ body: {} }, {}, next);
    expect(next).toHaveBeenLastCalledWith();

    validate(() => ({ a: 'salah' }))({ body: {} }, {}, next);
    const error = next.mock.calls.at(-1)[0];
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.errors).toEqual({ a: 'salah' });
  });

  it('errorHandler memetakan setiap jenis error', () => {
    const res = buildRes();
    errorHandler(new NotFoundError('hilang'), {}, res, vi.fn());
    expect(res.status).toHaveBeenLastCalledWith(404);
    expect(res.json).toHaveBeenLastCalledWith({ success: false, message: 'hilang', errors: null });

    errorHandler(Object.assign(new Error('x'), { type: 'entity.parse.failed' }), {}, res, vi.fn());
    expect(res.status).toHaveBeenLastCalledWith(400);

    errorHandler(Object.assign(new Error('x'), { type: 'entity.too.large' }), {}, res, vi.fn());
    expect(res.status).toHaveBeenLastCalledWith(413);

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('rahasia internal'), {}, res, vi.fn());
    expect(res.status).toHaveBeenLastCalledWith(500);
    expect(res.json.mock.calls.at(-1)[0].message).toBe('Terjadi kesalahan pada server');
    expect(spy).toHaveBeenCalled();
  });

  describe('authenticate', () => {
    const tokenService = createTokenService({ secret: 'rahasia', expiresIn: '1h' });
    const users = new Map([[1, { id: 1, name: 'Eliza' }]]);
    const authenticate = createAuthenticate({ tokenService, findUserById: (id) => users.get(id) });
    const run = (headers) => {
      const req = { headers };
      const next = vi.fn();
      authenticate(req, {}, next);
      return { req, error: next.mock.calls[0][0] };
    };

    it('menolak header kosong atau salah format', () => {
      expect(run({}).error).toBeInstanceOf(UnauthorizedError);
      expect(run({ authorization: 'Basic abc' }).error).toBeInstanceOf(UnauthorizedError);
    });

    it('menolak token rusak dan pengguna yang tidak ada', () => {
      expect(run({ authorization: 'Bearer rusak' }).error.message).toMatch(/Token tidak valid/);
      const orphan = tokenService.generate({ id: 99 });
      expect(run({ authorization: `Bearer ${orphan}` }).error.message).toBe('Pengguna tidak ditemukan');
    });

    it('mengisi req.user untuk token valid', () => {
      const { req, error } = run({ authorization: `Bearer ${tokenService.generate({ id: 1 })}` });
      expect(error).toBeUndefined();
      expect(req.user).toEqual({ id: 1, name: 'Eliza' });
    });
  });

  it('rate limiter menolak permintaan berlebih dengan 429', async () => {
    const app = express();
    app.use(createRateLimiter({ windowMs: 60000, max: 1 }));
    app.get('/', (req, res) => res.json({ ok: true }));
    app.use(errorHandler);

    expect((await request(app).get('/')).status).toBe(200);
    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });
});

describe('security', () => {
  it('hash dan verifikasi password', async () => {
    const hasher = createPasswordHasher({ saltRounds: 4 });
    const hash = await hasher.hash('rahasia123');
    expect(hash).not.toBe('rahasia123');
    expect(await hasher.compare('rahasia123', hash)).toBe(true);
    expect(await hasher.compare('salah', hash)).toBe(false);
  });

  it('membuat dan memverifikasi token', () => {
    const service = createTokenService({ secret: 'a', expiresIn: '1h' });
    expect(service.verify(service.generate({ id: 5 })).id).toBe(5);
    expect(() => createTokenService({ secret: 'b', expiresIn: '1h' }).verify(service.generate({ id: 5 }))).toThrow();
  });
});

describe('database', () => {
  it('commit saat sukses dan rollback saat gagal', () => {
    const db = openDatabase(':memory:');
    db.exec('CREATE TABLE t (id INTEGER)');

    expect(runInTransaction(db, () => { db.exec('INSERT INTO t VALUES (1)'); return 'ok'; })).toBe('ok');
    expect(() => runInTransaction(db, () => {
      db.exec('INSERT INTO t VALUES (2)');
      throw new Error('batal');
    })).toThrow('batal');

    expect(db.prepare('SELECT COUNT(*) AS n FROM t').get().n).toBe(1);
    expect(db.prepare('PRAGMA foreign_keys').get().foreign_keys).toBe(1);
    db.close();
  });
});

describe('startServer', () => {
  it('menjalankan server dan menutupnya dengan rapi saat SIGINT dan SIGTERM', async () => {
    const { startServer } = await import('../../src/server.js');
    vi.spyOn(console, 'log').mockImplementation(() => {});

    for (const signal of ['SIGINT', 'SIGTERM']) {
      const processRef = new EventEmitter();
      const closed = new Promise((resolve) => {
        const exit = vi.fn(resolve);
        const { server, db } = startServer({
          config: loadConfig({ PORT: '0', DB_PATH: ':memory:' }), processRef, exit
        });
        server.once('listening', async () => {
          const health = await request(server).get('/api/health');
          expect(health.body.status).toBe('ok');
          expect(db.isOpen).toBe(true);
          processRef.emit(signal);
        });
      });
      expect(await closed).toBe(0);
    }
  });
});
