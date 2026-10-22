import { UnauthorizedError } from '../errors/app-error.js';

const BEARER_PREFIX = 'Bearer ';

export const createAuthenticate = ({ tokenService, findUserById }) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    return next(new UnauthorizedError('Header otentikasi tidak ditemukan atau formatnya salah'));
  }

  let payload;
  try {
    payload = tokenService.verify(header.slice(BEARER_PREFIX.length));
  } catch {
    return next(new UnauthorizedError('Token tidak valid atau sudah kedaluwarsa'));
  }

  const user = findUserById(payload.id);
  if (!user) {
    return next(new UnauthorizedError('Pengguna tidak ditemukan'));
  }

  req.user = user;
  return next();
};
