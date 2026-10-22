import { NotFoundError } from '../../../core/errors/app-error.js';

export class GetProfile {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  execute({ userId }) {
    const user = this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Pengguna tidak ditemukan');
    }
    return user;
  }
}
