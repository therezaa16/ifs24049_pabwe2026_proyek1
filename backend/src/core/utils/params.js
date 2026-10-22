import { ValidationError } from '../errors/app-error.js';

export const parseIdParam = (raw, label = 'ID') => {
  const text = String(raw);
  const id = Number(text);
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(id)) {
    throw new ValidationError(`${label} tidak valid`);
  }
  return id;
};
