import bcrypt from 'bcryptjs';

export const createPasswordHasher = ({ saltRounds }) => ({
  hash: (plainPassword) => bcrypt.hash(plainPassword, saltRounds),
  compare: (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword)
});
