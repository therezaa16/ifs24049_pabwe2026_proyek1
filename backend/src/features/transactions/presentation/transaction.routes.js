import { Router } from 'express';
import { asyncHandler } from '../../../core/middleware/async-handler.js';
import { validate } from '../../../core/middleware/validation.middleware.js';
import { validateCreateTransaction } from '../domain/transaction.validator.js';

/**
 * Sengaja tidak ada endpoint "unlock" langsung: keinginan hanya dapat dibuka
 * lewat penyelesaian misi belajar (fitur study-missions).
 */
export const createTransactionRouter = ({ controller, authenticate }) => {
  const router = Router();

  router.use(authenticate);
  router.post('/', validate(validateCreateTransaction), asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.detail));
  router.post('/:id/cancel', asyncHandler(controller.cancel));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
};
