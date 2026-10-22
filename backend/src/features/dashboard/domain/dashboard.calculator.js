import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '../../transactions/index.js';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

const WANT_BUCKET_BY_STATUS = Object.freeze({
  [TRANSACTION_STATUSES.UNLOCKED]: 'wantsUnlocked',
  [TRANSACTION_STATUSES.LOCKED]: 'wantsLocked',
  [TRANSACTION_STATUSES.CANCELLED]: 'wantsCancelled'
});

const resolveBucket = ({ type, status }) => {
  if (type === TRANSACTION_TYPES.INCOME && status === TRANSACTION_STATUSES.ACTIVE) return 'income';
  if (type === TRANSACTION_TYPES.NEED && status === TRANSACTION_STATUSES.ACTIVE) return 'needs';
  if (type === TRANSACTION_TYPES.WANT) return WANT_BUCKET_BY_STATUS[status] ?? null;
  return null;
};

export const summarizeFinancials = (rows) => {
  const buckets = {
    income: { amount: 0, count: 0 },
    needs: { amount: 0, count: 0 },
    wantsUnlocked: { amount: 0, count: 0 },
    wantsLocked: { amount: 0, count: 0 },
    wantsCancelled: { amount: 0, count: 0 }
  };

  for (const row of rows) {
    const bucket = resolveBucket(row);
    if (bucket) {
      buckets[bucket].amount += Number(row.total);
      buckets[bucket].count += Number(row.count);
    }
  }

  return buckets;
};

/**
 * Persentase keinginan yang sudah diselesaikan: dibuka lewat belajar atau dibatalkan.
 * Tanpa keinginan sama sekali, skor dianggap penuh.
 */
export const calculateDisciplineScore = ({ wantsUnlocked, wantsLocked, wantsCancelled }) => {
  const total = wantsUnlocked.count + wantsLocked.count + wantsCancelled.count;
  if (total === 0) return 100;
  return Math.round(((wantsUnlocked.count + wantsCancelled.count) / total) * 100);
};

const toLocalDate = (instant, offsetMinutes) => new Date(new Date(instant).getTime() + offsetMinutes * MS_PER_MINUTE);

export const toLocalDateKey = (instant, offsetMinutes) =>
  toLocalDate(instant, offsetMinutes).toISOString().slice(0, 10);

export const startOfLocalDay = (now, offsetMinutes, daysBack) => {
  const local = toLocalDate(now, offsetMinutes);
  const utcMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysBack);
  return new Date(utcMidnight - offsetMinutes * MS_PER_MINUTE);
};

export const startOfLocalMonth = (now, offsetMinutes) => {
  const local = toLocalDate(now, offsetMinutes);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - offsetMinutes * MS_PER_MINUTE);
};

export const calculateMonthlySpending = ({ now, offsetMinutes, expenseRows }) => {
  const monthStart = startOfLocalMonth(now, offsetMinutes).getTime();
  return expenseRows
    .filter((row) => new Date(row.occurred_at).getTime() >= monthStart)
    .reduce((sum, row) => sum + Number(row.amount), 0);
};

const sumByDay = (dates, rows, readInstant, readValue, offsetMinutes) => {
  const totals = Object.fromEntries(dates.map((date) => [date, 0]));
  for (const row of rows) {
    const key = toLocalDateKey(readInstant(row), offsetMinutes);
    if (key in totals) {
      totals[key] += Number(readValue(row));
    }
  }
  return dates.map((date) => totals[date]);
};

export const buildDailyTrend = ({ now, offsetMinutes, days, expenseRows, studyRows }) => {
  const dates = Array.from({ length: days }, (_, index) =>
    toLocalDateKey(new Date(now.getTime() - (days - 1 - index) * MS_PER_DAY), offsetMinutes));

  return {
    dates,
    expenses: sumByDay(dates, expenseRows, (row) => row.occurred_at, (row) => row.amount, offsetMinutes),
    studyMinutes: sumByDay(dates, studyRows, (row) => row.completed_at, (row) => row.duration_minutes, offsetMinutes)
  };
};
