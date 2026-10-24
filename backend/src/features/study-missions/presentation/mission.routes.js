import { Router } from 'express';
import { asyncHandler } from '../../../core/middleware/async-handler.js';
import { validate } from '../../../core/middleware/validation.middleware.js';
import { validateCreateDeck, validateGenerateAiCards } from '../domain/deck.validator.js';
import { validateCompleteSession, validateStartSession } from '../domain/mission.validator.js';

export const createMissionRouter = ({ controller, authenticate }) => {
  const router = Router();

  router.use(authenticate);
  router.get('/settings', asyncHandler(controller.settings));
  router.post('/sessions', validate(validateStartSession), asyncHandler(controller.start));
  router.post('/sessions/:id/complete', validate(validateCompleteSession), asyncHandler(controller.complete));
  router.get('/history', asyncHandler(controller.history));
  router.get('/active-recall/decks', asyncHandler(controller.decks));
  router.post('/active-recall/generate', validate(validateGenerateAiCards), asyncHandler(controller.generateAi));
  router.post('/active-recall/decks', validate(validateCreateDeck), asyncHandler(controller.createDeck));
  router.delete('/active-recall/decks/:id', asyncHandler(controller.deleteDeck));

  return router;
};
