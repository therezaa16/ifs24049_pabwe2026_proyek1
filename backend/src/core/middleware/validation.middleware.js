import { ValidationError } from '../errors/app-error.js';
import { hasErrors } from '../utils/validation.js';

export const validate = (validator) => (req, res, next) => {
  const errors = validator(req.body);
  if (hasErrors(errors)) {
    return next(new ValidationError('Validasi input gagal', errors));
  }
  return next();
};
