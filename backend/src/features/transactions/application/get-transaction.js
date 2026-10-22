import { NotFoundError } from '../../../core/errors/app-error.js';

export class GetTransaction {
  constructor({ transactionRepository }) {
    this.transactionRepository = transactionRepository;
  }

  execute({ userId, id }) {
    const transaction = this.transactionRepository.findById(id, userId);
    if (!transaction) {
      throw new NotFoundError('Transaksi tidak ditemukan');
    }
    return transaction;
  }
}
