import { TRANSACTION_STATUSES, buildNewTransaction } from '../domain/transaction.rules.js';

export class CreateTransaction {
  constructor({ transactionRepository }) {
    this.transactionRepository = transactionRepository;
  }

  execute({ userId, input }) {
    const transaction = this.transactionRepository.create(userId, buildNewTransaction(input));
    return { transaction, isLocked: transaction.status === TRANSACTION_STATUSES.LOCKED };
  }
}
