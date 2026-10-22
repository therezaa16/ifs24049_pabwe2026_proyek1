import { UnauthorizedError } from '../../../core/errors/app-error.js';
import { normalizeEmail, toPublicUser } from '../domain/user.js';

const INVALID_CREDENTIALS_MESSAGE = 'Email atau password salah';

export class LoginUser {
  constructor({ userRepository, passwordHasher, tokenService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    const user = this.userRepository.findByEmail(normalizeEmail(email));
    if (!user) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const isPasswordValid = await this.passwordHasher.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    return {
      token: this.tokenService.generate({ id: user.id, email: user.email }),
      user: toPublicUser(user)
    };
  }
}
