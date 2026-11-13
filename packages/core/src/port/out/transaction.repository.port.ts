import { Transaction } from '../../model/transaction';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionRepositoryPort {
  save(transaction: Transaction): Promise<Transaction>;
  findByAccountId(accountId: number): Promise<Transaction[]>;
}
