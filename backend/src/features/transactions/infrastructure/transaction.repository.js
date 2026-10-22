import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../domain/transaction.rules.js';

const COLUMNS = 'id, user_id, type, title, amount, category, note, status, mission_type, unlocked_at, created_at';

export class SqliteTransactionRepository {
  constructor({ db, clock }) {
    this.db = db;
    this.clock = clock;
  }

  create(userId, fields) {
    const result = this.db
      .prepare(`
        INSERT INTO transactions (user_id, type, title, amount, category, note, status, mission_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        userId,
        fields.type,
        fields.title,
        fields.amount,
        fields.category,
        fields.note,
        fields.status,
        fields.mission_type,
        this.clock().toISOString()
      );

    return this.findById(Number(result.lastInsertRowid), userId);
  }

  findAll(userId, { type, status } = {}) {
    const conditions = ['user_id = ?'];
    const params = [userId];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    return this.db
      .prepare(`SELECT ${COLUMNS} FROM transactions WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC, id DESC`)
      .all(...params);
  }

  findById(id, userId) {
    return this.db
      .prepare(`SELECT ${COLUMNS} FROM transactions WHERE id = ? AND user_id = ?`)
      .get(id, userId);
  }

  markUnlocked(id, userId, unlockedAt) {
    const result = this.db
      .prepare(`
        UPDATE transactions SET status = ?, unlocked_at = ?
        WHERE id = ? AND user_id = ? AND type = ? AND status = ?
      `)
      .run(TRANSACTION_STATUSES.UNLOCKED, unlockedAt, id, userId, TRANSACTION_TYPES.WANT, TRANSACTION_STATUSES.LOCKED);
    return result.changes > 0;
  }

  markCancelled(id, userId) {
    const result = this.db
      .prepare(`
        UPDATE transactions SET status = ?
        WHERE id = ? AND user_id = ? AND type = ? AND status = ?
      `)
      .run(TRANSACTION_STATUSES.CANCELLED, id, userId, TRANSACTION_TYPES.WANT, TRANSACTION_STATUSES.LOCKED);
    return result.changes > 0;
  }

  delete(id, userId) {
    const result = this.db
      .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return result.changes > 0;
  }
}
