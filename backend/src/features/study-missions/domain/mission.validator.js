import { MISSION_TYPES, MISSION_TYPE_VALUES } from '../../../core/domain/mission-types.js';
import { isNonBlankString, isPositiveInteger, toNumberOrNaN } from '../../../core/utils/validation.js';

const SUBJECT_MIN_LENGTH = 2;
const SUBJECT_MAX_LENGTH = 100;
const MAX_POMODORO_MINUTES = 120;

const validateSubject = (subject) => {
  if (!isNonBlankString(subject)) return 'Mata kuliah / topik belajar wajib diisi';
  if (subject.trim().length < SUBJECT_MIN_LENGTH) return `Topik belajar minimal ${SUBJECT_MIN_LENGTH} karakter`;
  if (subject.trim().length > SUBJECT_MAX_LENGTH) return `Topik belajar maksimal ${SUBJECT_MAX_LENGTH} karakter`;
  return null;
};

const validateDuration = (duration) => {
  const valid = isPositiveInteger(duration) && Number(duration) <= MAX_POMODORO_MINUTES;
  return valid ? null : `Durasi harus bilangan bulat 1 sampai ${MAX_POMODORO_MINUTES} menit`;
};

const validateOptionalTransactionId = (transactionId) => {
  if (transactionId === undefined || transactionId === null) return null;
  return isPositiveInteger(transactionId) ? null : 'ID keinginan yang ingin dibuka tidak valid';
};

export const validateStartSession = (body = {}) => {
  const errors = {};

  if (!MISSION_TYPE_VALUES.includes(body.mission_type)) {
    errors.mission_type = `Tipe misi harus salah satu dari: ${MISSION_TYPE_VALUES.join(', ')}`;
  } else if (body.mission_type === MISSION_TYPES.POMODORO) {
    const subjectError = validateSubject(body.subject);
    const durationError = validateDuration(body.duration_minutes);
    if (subjectError) errors.subject = subjectError;
    if (durationError) errors.duration_minutes = durationError;
  } else if (!isPositiveInteger(body.deck_id)) {
    errors.deck_id = 'Materi kuis (deck_id) wajib dipilih';
  }

  const transactionError = validateOptionalTransactionId(body.transaction_id);
  if (transactionError) errors.transaction_id = transactionError;

  return errors;
};

export const validateCompleteSession = (body = {}) => {
  const hasScore = body.score !== undefined && body.score !== null;
  if (!hasScore) return {};

  const score = toNumberOrNaN(body.score);
  const valid = Number.isInteger(score) && score >= 0 && score <= 100;
  return valid ? {} : { score: 'Skor harus bilangan bulat antara 0 sampai 100' };
};
