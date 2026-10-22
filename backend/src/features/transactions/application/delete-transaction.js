import { NotFoundError } from '../../../core/errors/app-error.js';

export class DeleteTransaction {
  constructor({ transactionRepository }) {
    this.transactionRepository = transactionRepository;
  }

  execute({ userId, id }) {
    if (!this.transactionRepository.delete(id, userId)) {
      throw new NotFoundError('Transaksi tidak ditemukan');
    }
  }
}
