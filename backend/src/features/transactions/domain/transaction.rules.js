import { ValidationError } from '../../../core/errors/app-error.js';
import { MISSION_TYPES } from '../../../core/domain/mission-types.js';

export const TRANSACTION_TYPES = Object.freeze({
  INCOME: 'pemasukan',
  NEED: 'kebutuhan',
  WANT: 'keinginan'
});

export const TRANSACTION_STATUSES = Object.freeze({
  ACTIVE: 'aktif',
  LOCKED: 'terkunci',
  UNLOCKED: 'terbuka',
  CANCELLED: 'dibatalkan'
});

export const TRANSACTION_TYPE_VALUES = Object.freeze(Object.values(TRANSACTION_TYPES));
export const TRANSACTION_STATUS_VALUES = Object.freeze(Object.values(TRANSACTION_STATUSES));

/**
 * Aturan inti aplikasi: pengeluaran bertipe Keinginan tidak langsung berlaku.
 * Ia lahir dalam status TERKUNCI dan baru dihitung sebagai pengeluaran setelah
 * pengguna menyelesaikan misi belajar.
 */
export const buildNewTransaction = (input) => {
  const isWant = input.type === TRANSACTION_TYPES.WANT;

  return {
    type: input.type,
    title: input.title.trim(),
    amount: Number(input.amount),
    category: input.category.trim(),
    note: typeof input.note === 'string' ? input.note.trim() : '',
    status: isWant ? TRANSACTION_STATUSES.LOCKED : TRANSACTION_STATUSES.ACTIVE,
    mission_type: isWant ? (input.mission_type || MISSION_TYPES.POMODORO) : null
  };
};

export const assertCanBeUnlocked = (transaction) => {
  if (transaction.type !== TRANSACTION_TYPES.WANT) {
    throw new ValidationError('Hanya transaksi bertipe Keinginan yang dapat dibuka dengan misi');
  }
  if (transaction.status !== TRANSACTION_STATUSES.LOCKED) {
    throw new ValidationError(`Transaksi sudah berstatus ${transaction.status}`);
  }
};

export const assertCanBeCancelled = (transaction) => {
  if (transaction.type !== TRANSACTION_TYPES.WANT) {
    throw new ValidationError('Hanya transaksi bertipe Keinginan yang dapat dibatalkan');
  }
  if (transaction.status !== TRANSACTION_STATUSES.LOCKED) {
    throw new ValidationError('Hanya transaksi berstatus terkunci yang dapat dibatalkan');
  }
};
