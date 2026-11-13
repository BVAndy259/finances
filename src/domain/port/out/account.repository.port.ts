import { Account } from '../../model/account';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepositoryPort {
  save(account: Account): Promise<Account>;
  findById(id: number): Promise<Account | null>;
  findByUserId(userId: number): Promise<Account[]>;
}
