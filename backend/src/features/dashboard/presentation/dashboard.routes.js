import { Router } from 'express';
import { asyncHandler } from '../../../core/middleware/async-handler.js';

export const createDashboardRouter = ({ controller, authenticate }) => {
  const router = Router();

  router.use(authenticate);
  router.get('/summary', asyncHandler(controller.summary));

  return router;
};
