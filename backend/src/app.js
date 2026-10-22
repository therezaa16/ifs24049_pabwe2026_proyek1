import cors from 'cors';
import express from 'express';
import { NotFoundError } from './core/errors/app-error.js';
import { errorHandler } from './core/middleware/error.middleware.js';
import { createRateLimiter } from './core/middleware/rate-limit.middleware.js';
import { createPasswordHasher } from './core/security/password-hasher.js';
import { createTokenService } from './core/security/token-service.js';
import { createAuthModule } from './features/auth/index.js';
import { createDashboardModule } from './features/dashboard/index.js';
import { createMissionsModule } from './features/study-missions/index.js';
import { createTransactionsModule } from './features/transactions/index.js';

export const APP_NAME = 'Disiplin Finansial Mahasiswa API';

export const createApp = ({ db, clock, config }) => {
  const passwordHasher = createPasswordHasher({ saltRounds: config.bcryptSaltRounds });
  const tokenService = createTokenService({ secret: config.jwtSecret, expiresIn: config.jwtExpiresIn });

  const auth = createAuthModule({
    db,
    clock,
    passwordHasher,
    tokenService,
    rateLimiter: createRateLimiter(config.authRateLimit)
  });
  const transactions = createTransactionsModule({ db, clock, authenticate: auth.authenticate });
  const missions = createMissionsModule({
    db,
    clock,
    authenticate: auth.authenticate,
    transactionRepository: transactions.transactionRepository,
    timeScale: config.missionTimeScale
  });
  const dashboard = createDashboardModule({
    db,
    clock,
    authenticate: auth.authenticate,
    timezoneOffsetMinutes: config.timezoneOffsetMinutes
  });

  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: clock().toISOString(), appName: APP_NAME });
  });

  app.use('/api/auth', auth.router);
  app.use('/api/transactions', transactions.router);
  app.use('/api/missions', missions.router);
  app.use('/api/dashboard', dashboard.router);

  app.use((req, res, next) => {
    next(new NotFoundError(`Rute ${req.method} ${req.originalUrl} tidak ditemukan`));
  });
  app.use(errorHandler);

  return app;
};
