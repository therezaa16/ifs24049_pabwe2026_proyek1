import { Router } from 'express';
import { asyncHandler } from '../../../core/middleware/async-handler.js';
import { validate } from '../../../core/middleware/validation.middleware.js';
import { validateBudget, validateLogin, validateRegister } from '../domain/auth.validator.js';

export const createAuthRouter = ({ controller, authenticate, rateLimiter }) => {
  const router = Router();

  router.post('/register', rateLimiter, validate(validateRegister), asyncHandler(controller.register));
  router.post('/login', rateLimiter, validate(validateLogin), asyncHandler(controller.login));
  router.get('/me', authenticate, asyncHandler(controller.me));
  router.patch('/budget', authenticate, validate(validateBudget), asyncHandler(controller.setBudget));

  return router;
};
