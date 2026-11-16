import { Transaction, TransactionType } from '../../model/transaction';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionFilters {
  accountId?: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
}

export interface TransactionRepositoryPort {
  save(transaction: Transaction): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByAccountId(accountId: string): Promise<Transaction[]>;
  findByUserId(
    userId: string,
    filters: TransactionFilters,
  ): Promise<PaginatedTransactions>;
  existsByAccountId(accountId: string): Promise<boolean>;
}
