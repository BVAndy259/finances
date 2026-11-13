import { Loan } from '../../model/loan';

export const LOAN_REPOSITORY = Symbol('LOAN_REPOSITORY');

export interface LoanRepositoryPort {
  save(loan: Loan): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findByUserId(userId: string): Promise<Loan[]>;
  findByUserIdAndStatusIn(userId: string, statuses: string[]): Promise<Loan[]>;
  existsByAccountId(accountId: string): Promise<boolean>;
}
