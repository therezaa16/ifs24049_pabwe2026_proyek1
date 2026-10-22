import { AppError } from '../errors/app-error.js';

const buildBody = (message, errors = null) => ({ success: false, message, errors });

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(buildBody(err.message, err.errors));
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(buildBody('Format JSON pada body permintaan tidak valid'));
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json(buildBody('Ukuran body permintaan terlalu besar'));
  }

  console.error('[error]', err);
  return res.status(500).json(buildBody('Terjadi kesalahan pada server'));
};
