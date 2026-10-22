import { httpClient } from '@/core/http/index.js';

export const missionsApi = {
  settings: () => httpClient.get('/missions/settings'),
  decks: () => httpClient.get('/missions/active-recall/decks'),
  history: () => httpClient.get('/missions/history'),
  start: ({ missionType, subject, durationMinutes, deckId, transactionId }) =>
    httpClient.post('/missions/sessions', {
      mission_type: missionType,
      subject,
      duration_minutes: durationMinutes,
      deck_id: deckId,
      transaction_id: transactionId ?? null
    }),
  complete: (sessionId, score) =>
    httpClient.post(`/missions/sessions/${sessionId}/complete`, score === undefined ? {} : { score })
};
