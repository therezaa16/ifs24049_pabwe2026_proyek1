import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../errors/app-error.js';

export const createRateLimiter = ({ windowMs, max }) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => next(new TooManyRequestsError('Terlalu banyak percobaan, silakan coba lagi beberapa saat lagi'))
});
