import { parseIdParam } from '../../../core/utils/params.js';

const TRANSACTION_ID_LABEL = 'ID transaksi';

export class TransactionController {
  constructor({ createTransaction, listTransactions, getTransaction, cancelTransaction, deleteTransaction }) {
    this.createTransaction = createTransaction;
    this.listTransactions = listTransactions;
    this.getTransaction = getTransaction;
    this.cancelTransaction = cancelTransaction;
    this.deleteTransaction = deleteTransaction;
  }

  create = async (req, res) => {
    const { transaction, isLocked } = this.createTransaction.execute({
      userId: req.user.id,
      input: req.body
    });

    const message = isLocked
      ? 'Keinginan dicatat dengan status TERKUNCI. Selesaikan misi belajar untuk membukanya.'
      : 'Transaksi berhasil dicatat';

    res.status(201).json({ success: true, message, isLocked, transaction });
  };

  list = async (req, res) => {
    const transactions = this.listTransactions.execute({ userId: req.user.id, query: req.query });
    res.status(200).json({ success: true, count: transactions.length, transactions });
  };

  detail = async (req, res) => {
    const transaction = this.getTransaction.execute({
      userId: req.user.id,
      id: parseIdParam(req.params.id, TRANSACTION_ID_LABEL)
    });
    res.status(200).json({ success: true, transaction });
  };

  cancel = async (req, res) => {
    const transaction = this.cancelTransaction.execute({
      userId: req.user.id,
      id: parseIdParam(req.params.id, TRANSACTION_ID_LABEL)
    });
    res.status(200).json({
      success: true,
      message: 'Keinginan dibatalkan. Uangmu tetap aman!',
      transaction
    });
  };

  remove = async (req, res) => {
    this.deleteTransaction.execute({
      userId: req.user.id,
      id: parseIdParam(req.params.id, TRANSACTION_ID_LABEL)
    });
    res.status(200).json({ success: true, message: 'Transaksi berhasil dihapus' });
  };
}
