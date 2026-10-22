import { isNonBlankString, isNonNegativeNumber } from '../../../core/utils/validation.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 6;
// bcrypt hanya memproses 72 byte pertama, sehingga batas ini mencegah password terpotong diam-diam.
const PASSWORD_MAX_BYTES = 72;
const BUDGET_MAX = 1_000_000_000_000;

const validateName = (name) => {
  if (!isNonBlankString(name)) return 'Nama lengkap wajib diisi';
  if (name.trim().length < NAME_MIN_LENGTH) return `Nama lengkap minimal ${NAME_MIN_LENGTH} karakter`;
  if (name.trim().length > NAME_MAX_LENGTH) return `Nama lengkap maksimal ${NAME_MAX_LENGTH} karakter`;
  return null;
};

const validateEmail = (email) => {
  if (!isNonBlankString(email) || !EMAIL_PATTERN.test(email.trim())) return 'Format email tidak valid';
  if (email.trim().length > EMAIL_MAX_LENGTH) return `Email maksimal ${EMAIL_MAX_LENGTH} karakter`;
  return null;
};

const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return `Password minimal ${PASSWORD_MIN_LENGTH} karakter`;
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    return `Password maksimal ${PASSWORD_MAX_BYTES} byte`;
  }
  return null;
};

const validateBudgetValue = (budget) => {
  if (!isNonNegativeNumber(budget) || Number(budget) > BUDGET_MAX) {
    return 'Anggaran bulanan harus berupa angka non-negatif yang wajar';
  }
  return null;
};

const collect = (entries) => Object.fromEntries(entries.filter(([, message]) => message !== null));

export const validateRegister = (body = {}) => {
  const hasBudget = body.monthly_budget !== undefined && body.monthly_budget !== null;
  return collect([
    ['name', validateName(body.name)],
    ['email', validateEmail(body.email)],
    ['password', validatePassword(body.password)],
    ['monthly_budget', hasBudget ? validateBudgetValue(body.monthly_budget) : null]
  ]);
};

export const validateLogin = (body = {}) => collect([
  ['email', isNonBlankString(body.email) ? null : 'Email wajib diisi'],
  ['password', isNonBlankString(body.password) ? null : 'Password wajib diisi']
]);

export const validateBudget = (body = {}) => {
  const isMissing = body.monthly_budget === undefined || body.monthly_budget === null;
  return collect([
    ['monthly_budget', isMissing ? 'Anggaran bulanan wajib diisi' : validateBudgetValue(body.monthly_budget)]
  ]);
};
