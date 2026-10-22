import { ConflictError } from '../../../core/errors/app-error.js';
import { normalizeEmail, toPublicUser } from '../domain/user.js';

export class RegisterUser {
  constructor({ userRepository, passwordHasher, tokenService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ name, email, password, monthly_budget: monthlyBudget }) {
    const normalizedEmail = normalizeEmail(email);

    if (this.userRepository.findByEmail(normalizedEmail)) {
      throw new ConflictError('Email sudah terdaftar, silakan gunakan email lain atau masuk');
    }

    const user = this.userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await this.passwordHasher.hash(password),
      monthlyBudget: monthlyBudget === undefined || monthlyBudget === null ? 0 : Number(monthlyBudget)
    });

    return {
      token: this.tokenService.generate({ id: user.id, email: user.email }),
      user: toPublicUser(user)
    };
  }
}
