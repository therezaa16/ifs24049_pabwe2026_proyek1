import jwt from 'jsonwebtoken';

export const createTokenService = ({ secret, expiresIn }) => ({
  generate: (payload) => jwt.sign(payload, secret, { expiresIn }),
  verify: (token) => jwt.verify(token, secret)
});
