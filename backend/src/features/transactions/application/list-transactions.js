import { ValidationError } from '../../../core/errors/app-error.js';
import { hasErrors } from '../../../core/utils/validation.js';
import { validateTransactionFilters } from '../domain/transaction.validator.js';

export class ListTransactions {
  constructor({ transactionRepository }) {
    this.transactionRepository = transactionRepository;
  }

  execute({ userId, query }) {
    const errors = validateTransactionFilters(query);
    if (hasErrors(errors)) {
      throw new ValidationError('Parameter pencarian tidak valid', errors);
    }

    return this.transactionRepository.findAll(userId, { type: query.type, status: query.status });
  }
}
