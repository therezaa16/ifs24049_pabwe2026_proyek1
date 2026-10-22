import dotenv from 'dotenv';

dotenv.config();

const DEVELOPMENT_JWT_SECRET = 'rahasia-pengembangan-jangan-dipakai-di-production';

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toOriginList = (value) => {
  if (!value) return '*';
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
};

export const loadConfig = (env = process.env) => {
  const nodeEnv = env.NODE_ENV || 'development';
  const jwtSecret = env.JWT_SECRET || (nodeEnv === 'production' ? '' : DEVELOPMENT_JWT_SECRET);

  if (!jwtSecret) {
    throw new Error('JWT_SECRET wajib diatur ketika NODE_ENV=production');
  }

  return Object.freeze({
    nodeEnv,
    port: toInteger(env.PORT, 5000),
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    dbPath: env.DB_PATH || 'disiplin_finansial.sqlite',
    bcryptSaltRounds: toInteger(env.BCRYPT_SALT_ROUNDS, 10),
    corsOrigin: toOriginList(env.CORS_ORIGIN),
    timezoneOffsetMinutes: toInteger(env.TIMEZONE_OFFSET_MINUTES, 420),
    missionTimeScale: toPositiveNumber(env.MISSION_TIME_SCALE, 1),
    authRateLimit: Object.freeze({
      windowMs: toInteger(env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: toInteger(env.AUTH_RATE_LIMIT_MAX, 30)
    })
  });
};

export const config = loadConfig();
