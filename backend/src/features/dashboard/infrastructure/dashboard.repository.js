import { MISSION_TYPES } from '../../../core/domain/mission-types.js';
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../../transactions/index.js';

// Pengeluaran yang benar-benar berlaku: kebutuhan, atau keinginan yang sudah dibuka.
const EFFECTIVE_SPENDING = `(
  type = '${TRANSACTION_TYPES.NEED}'
  OR (type = '${TRANSACTION_TYPES.WANT}' AND status = '${TRANSACTION_STATUSES.UNLOCKED}')
)`;
const SPENT_AT = 'COALESCE(unlocked_at, created_at)';
const COMPLETED_STATUS = 'selesai';

export class SqliteDashboardRepository {
  constructor({ db }) {
    this.db = db;
  }

  getMonthlyBudget(userId) {
    return Number(this.db.prepare('SELECT monthly_budget FROM users WHERE id = ?').get(userId).monthly_budget);
  }

  getFinancialTotals(userId) {
    return this.db
      .prepare(`
        SELECT type, status, SUM(amount) AS total, COUNT(*) AS count
        FROM transactions WHERE user_id = ? GROUP BY type, status
      `)
      .all(userId);
  }

  getSpendingRows(userId, sinceIso) {
    return this.db
      .prepare(`
        SELECT ${SPENT_AT} AS occurred_at, amount
        FROM transactions
        WHERE user_id = ? AND ${EFFECTIVE_SPENDING} AND ${SPENT_AT} >= ?
      `)
      .all(userId, sinceIso);
  }

  getCategorySpending(userId, sinceIso) {
    return this.db
      .prepare(`
        SELECT category, SUM(amount) AS total
        FROM transactions
        WHERE user_id = ? AND ${EFFECTIVE_SPENDING} AND ${SPENT_AT} >= ?
        GROUP BY category ORDER BY total DESC
      `)
      .all(userId, sinceIso);
  }

  getStudyRows(userId, sinceIso) {
    return this.db
      .prepare(`
        SELECT completed_at, duration_minutes
        FROM study_missions
        WHERE user_id = ? AND status = ? AND completed_at >= ?
      `)
      .all(userId, COMPLETED_STATUS, sinceIso);
  }

  getMissionStats(userId) {
    const row = this.db
      .prepare(`
        SELECT
          COUNT(*) AS total_missions,
          COALESCE(SUM(duration_minutes), 0) AS total_minutes,
          COALESCE(AVG(score), 0) AS avg_score,
          COALESCE(SUM(CASE WHEN mission_type = ? THEN 1 ELSE 0 END), 0) AS pomodoro_count,
          COALESCE(SUM(CASE WHEN mission_type = ? THEN 1 ELSE 0 END), 0) AS active_recall_count
        FROM study_missions WHERE user_id = ? AND status = ?
      `)
      .get(MISSION_TYPES.POMODORO, MISSION_TYPES.ACTIVE_RECALL, userId, COMPLETED_STATUS);

    return {
      totalMissions: Number(row.total_missions),
      totalMinutes: Number(row.total_minutes),
      avgScore: Math.round(Number(row.avg_score)),
      pomodoroCount: Number(row.pomodoro_count),
      activeRecallCount: Number(row.active_recall_count)
    };
  }

  getRecentTransactions(userId, limit) {
    return this.db
      .prepare(`
        SELECT id, type, title, amount, category, status, mission_type, created_at
        FROM transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?
      `)
      .all(userId, limit);
  }

  getRecentMissions(userId, limit) {
    return this.db
      .prepare(`
        SELECT id, mission_type, subject, duration_minutes, score, completed_at
        FROM study_missions WHERE user_id = ? AND status = ? ORDER BY completed_at DESC, id DESC LIMIT ?
      `)
      .all(userId, COMPLETED_STATUS, limit);
  }
}
