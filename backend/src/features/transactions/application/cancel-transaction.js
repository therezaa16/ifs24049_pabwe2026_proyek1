import { assertCanBeCancelled } from '../domain/transaction.rules.js';
import { GetTransaction } from './get-transaction.js';

export class CancelTransaction {
  constructor({ transactionRepository }) {
    this.transactionRepository = transactionRepository;
    this.getTransaction = new GetTransaction({ transactionRepository });
  }

  execute({ userId, id }) {
    assertCanBeCancelled(this.getTransaction.execute({ userId, id }));
    this.transactionRepository.markCancelled(id, userId);
    return this.transactionRepository.findById(id, userId);
  }
}
