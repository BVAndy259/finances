import { AccountEntity } from './account.entity';
import { AppUserEntity } from './app-user.entity';
import { LoanEntity } from './loan.entity';
import { TransactionEntity } from './transaction.entity';

export * from './account.entity';
export * from './app-user.entity';
export * from './loan.entity';
export * from './transaction.entity';

export const typeOrmEntities = [
  AppUserEntity,
  AccountEntity,
  TransactionEntity,
  LoanEntity,
];
