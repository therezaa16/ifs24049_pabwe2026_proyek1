import { MISSION_TYPE_VALUES } from '../../../core/domain/mission-types.js';
import { isNonBlankString, toNumberOrNaN } from '../../../core/utils/validation.js';
import {
  TRANSACTION_STATUS_VALUES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_VALUES
} from './transaction.rules.js';

const TITLE_MIN_LENGTH = 2;
const TITLE_MAX_LENGTH = 100;
const CATEGORY_MAX_LENGTH = 60;
const NOTE_MAX_LENGTH = 255;
const AMOUNT_MAX = 1_000_000_000_000;

const validateTitle = (title) => {
  if (!isNonBlankString(title)) return 'Judul transaksi wajib diisi';
  if (title.trim().length < TITLE_MIN_LENGTH) return `Judul transaksi minimal ${TITLE_MIN_LENGTH} karakter`;
  if (title.trim().length > TITLE_MAX_LENGTH) return `Judul transaksi maksimal ${TITLE_MAX_LENGTH} karakter`;
  return null;
};

const validateAmount = (amount) => {
  const number = toNumberOrNaN(amount);
  if (!(number > 0) || number > AMOUNT_MAX) return 'Nominal harus berupa angka lebih besar dari 0';
  return null;
};

const validateCategory = (category) => {
  if (!isNonBlankString(category)) return 'Kategori transaksi wajib diisi';
  if (category.trim().length > CATEGORY_MAX_LENGTH) return `Kategori maksimal ${CATEGORY_MAX_LENGTH} karakter`;
  return null;
};

const validateNote = (note) => {
  if (note === undefined || note === null) return null;
  if (typeof note !== 'string' || note.length > NOTE_MAX_LENGTH) {
    return `Catatan harus berupa teks maksimal ${NOTE_MAX_LENGTH} karakter`;
  }
  return null;
};

const validateMissionType = (type, missionType) => {
  if (type !== TRANSACTION_TYPES.WANT || !missionType) return null;
  if (!MISSION_TYPE_VALUES.includes(missionType)) {
    return `Tipe misi harus salah satu dari: ${MISSION_TYPE_VALUES.join(', ')}`;
  }
  return null;
};

export const validateCreateTransaction = (body = {}) => {
  const entries = [
    ['title', validateTitle(body.title)],
    ['type', TRANSACTION_TYPE_VALUES.includes(body.type)
      ? null
      : `Tipe transaksi harus salah satu dari: ${TRANSACTION_TYPE_VALUES.join(', ')}`],
    ['amount', validateAmount(body.amount)],
    ['category', validateCategory(body.category)],
    ['note', validateNote(body.note)],
    ['mission_type', validateMissionType(body.type, body.mission_type)]
  ];
  return Object.fromEntries(entries.filter(([, message]) => message !== null));
};

export const validateTransactionFilters = (query = {}) => {
  const errors = {};

  if (query.type && !TRANSACTION_TYPE_VALUES.includes(query.type)) {
    errors.type = `Filter tipe tidak valid (${TRANSACTION_TYPE_VALUES.join(', ')})`;
  }

  if (query.status && !TRANSACTION_STATUS_VALUES.includes(query.status)) {
    errors.status = `Filter status tidak valid (${TRANSACTION_STATUS_VALUES.join(', ')})`;
  }

  return errors;
};
