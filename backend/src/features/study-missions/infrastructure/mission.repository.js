import { MISSION_STATUSES } from '../domain/mission.rules.js';

const MISSION_SELECT = `
  SELECT m.id, m.user_id, m.transaction_id, m.deck_id, m.mission_type, m.subject, m.status,
         m.duration_minutes, m.required_seconds, m.score, m.started_at, m.completed_at,
         t.title AS transaction_title, t.amount AS transaction_amount
  FROM study_missions m
  LEFT JOIN transactions t ON t.id = m.transaction_id
`;

export class SqliteMissionRepository {
  constructor({ db }) {
    this.db = db;
  }

  createSession({ userId, transactionId, missionType, subject, deckId, durationMinutes, requiredSeconds, startedAt }) {
    const result = this.db
      .prepare(`
        INSERT INTO study_missions
          (user_id, transaction_id, deck_id, mission_type, subject, status, duration_minutes, required_seconds, started_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        userId,
        transactionId,
        deckId,
        missionType,
        subject,
        MISSION_STATUSES.RUNNING,
        durationMinutes,
        requiredSeconds,
        startedAt
      );

    return this.findById(Number(result.lastInsertRowid), userId);
  }

  findById(id, userId) {
    return this.db.prepare(`${MISSION_SELECT} WHERE m.id = ? AND m.user_id = ?`).get(id, userId);
  }

  markFinished({ id, userId, status, score, durationMinutes, completedAt }) {
    this.db
      .prepare(`
        UPDATE study_missions
        SET status = ?, score = ?, duration_minutes = ?, completed_at = ?
        WHERE id = ? AND user_id = ? AND status = ?
      `)
      .run(status, score, durationMinutes, completedAt, id, userId, MISSION_STATUSES.RUNNING);
  }

  findHistory(userId) {
    return this.db
      .prepare(`${MISSION_SELECT} WHERE m.user_id = ? AND m.status != ? ORDER BY m.completed_at DESC, m.id DESC`)
      .all(userId, MISSION_STATUSES.RUNNING);
  }

  findDecks(userId = null) {
    const query = userId !== null && userId !== undefined
      ? 'SELECT id, user_id, title, description, subject, content, created_at FROM active_recall_decks WHERE user_id IS NULL OR user_id = ? ORDER BY id ASC'
      : 'SELECT id, user_id, title, description, subject, content, created_at FROM active_recall_decks ORDER BY id ASC';

    const decks = userId !== null && userId !== undefined
      ? this.db.prepare(query).all(userId)
      : this.db.prepare(query).all();

    const selectCards = this.db.prepare(
      'SELECT id, deck_id, question, answer, explanation FROM active_recall_cards WHERE deck_id = ? ORDER BY id ASC'
    );

    return decks.map((deck) => ({ ...deck, cards: selectCards.all(deck.id) }));
  }

  findDeckById(id) {
    return this.db
      .prepare(`
        SELECT d.id, d.title, d.subject, COUNT(c.id) AS card_count
        FROM active_recall_decks d
        LEFT JOIN active_recall_cards c ON c.deck_id = d.id
        WHERE d.id = ?
        GROUP BY d.id
      `)
      .get(id);
  }

  createDeck({ userId = null, title, description = '', subject, content = '', cards = [], createdAt = new Date().toISOString() }) {
    const insertDeck = this.db.prepare(
      'INSERT INTO active_recall_decks (user_id, title, description, subject, content, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = insertDeck.run(userId, title, description, subject, content, createdAt);
    const deckId = Number(result.lastInsertRowid);

    const insertCard = this.db.prepare(
      'INSERT INTO active_recall_cards (deck_id, question, answer, explanation) VALUES (?, ?, ?, ?)'
    );

    const savedCards = [];
    for (const card of cards) {
      const cardRes = insertCard.run(deckId, card.question, card.answer, card.explanation ?? '');
      savedCards.push({
        id: Number(cardRes.lastInsertRowid),
        deck_id: deckId,
        question: card.question,
        answer: card.answer,
        explanation: card.explanation ?? ''
      });
    }

    return {
      id: deckId,
      user_id: userId,
      title,
      description,
      subject,
      content,
      created_at: createdAt,
      cards: savedCards
    };
  }

  deleteDeck(id, userId) {
    const result = this.db
      .prepare('DELETE FROM active_recall_decks WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return result.changes > 0;
  }
}
