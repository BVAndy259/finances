import { Loan } from '../../model/loan';

export const LOAN_REPOSITORY = Symbol('LOAN_REPOSITORY');

export interface LoanRepositoryPort {
  save(loan: Loan): Promise<Loan>;
  findById(id: number): Promise<Loan | null>;
  findByUserIdAndStatusIn(userId: number, statuses: string[]): Promise<Loan[]>;
}
