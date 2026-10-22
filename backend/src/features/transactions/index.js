import { CancelTransaction } from './application/cancel-transaction.js';
import { CreateTransaction } from './application/create-transaction.js';
import { DeleteTransaction } from './application/delete-transaction.js';
import { GetTransaction } from './application/get-transaction.js';
import { ListTransactions } from './application/list-transactions.js';
import { SqliteTransactionRepository } from './infrastructure/transaction.repository.js';
import { TransactionController } from './presentation/transaction.controller.js';
import { createTransactionRouter } from './presentation/transaction.routes.js';

export { transactionSchema } from './infrastructure/transaction.schema.js';
export { TRANSACTION_STATUSES, TRANSACTION_TYPES, assertCanBeUnlocked } from './domain/transaction.rules.js';

export const createTransactionsModule = ({ db, clock, authenticate }) => {
  const transactionRepository = new SqliteTransactionRepository({ db, clock });

  const controller = new TransactionController({
    createTransaction: new CreateTransaction({ transactionRepository }),
    listTransactions: new ListTransactions({ transactionRepository }),
    getTransaction: new GetTransaction({ transactionRepository }),
    cancelTransaction: new CancelTransaction({ transactionRepository }),
    deleteTransaction: new DeleteTransaction({ transactionRepository })
  });

  return {
    router: createTransactionRouter({ controller, authenticate }),
    transactionRepository
  };
};
