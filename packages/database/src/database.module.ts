import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsyncLocalStorage } from 'node:async_hooks';
import { EntityManager } from 'typeorm';
import {
  ACCOUNT_REPOSITORY,
  APP_USER_REPOSITORY,
  LOAN_REPOSITORY,
  TRANSACTION_REPOSITORY,
  UNIT_OF_WORK,
} from '@expense-tracker/core';
import { AccountRepositoryAdapter } from './adapters/account.repository.adapter';
import { AppUserRepositoryAdapter } from './adapters/app-user.repository.adapter';
import { LoanRepositoryAdapter } from './adapters/loan.repository.adapter';
import { TransactionRepositoryAdapter } from './adapters/transaction.repository.adapter';
import { typeOrmEntities } from './entities';
import { getDatabaseUrl, isDatabaseLoggingEnabled } from './env';
import { AccountMapper } from './mappers/account.mapper';
import { AppUserMapper } from './mappers/app-user.mapper';
import { LoanMapper } from './mappers/loan.mapper';
import { TransactionMapper } from './mappers/transaction.mapper';
import { TYPEORM_ASYNC_STORAGE } from './typeorm.constants';
import { TypeOrmContext } from './typeorm-context';
import { TypeOrmUnitOfWork } from './unit-of-work.adapter';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        url: getDatabaseUrl(),
        entities: typeOrmEntities,
        synchronize: false,
        logging: isDatabaseLoggingEnabled(),
      }),
    }),
    TypeOrmModule.forFeature(typeOrmEntities),
  ],
  providers: [
    {
      provide: TYPEORM_ASYNC_STORAGE,
      useFactory: () => new AsyncLocalStorage<EntityManager>(),
    },
    TypeOrmContext,
    TypeOrmUnitOfWork,
    AppUserMapper,
    AccountMapper,
    TransactionMapper,
    LoanMapper,
    AppUserRepositoryAdapter,
    AccountRepositoryAdapter,
    TransactionRepositoryAdapter,
    LoanRepositoryAdapter,
    {
      provide: APP_USER_REPOSITORY,
      useExisting: AppUserRepositoryAdapter,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useExisting: AccountRepositoryAdapter,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useExisting: TransactionRepositoryAdapter,
    },
    {
      provide: LOAN_REPOSITORY,
      useExisting: LoanRepositoryAdapter,
    },
    {
      provide: UNIT_OF_WORK,
      useExisting: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    APP_USER_REPOSITORY,
    ACCOUNT_REPOSITORY,
    TRANSACTION_REPOSITORY,
    LOAN_REPOSITORY,
    UNIT_OF_WORK,
  ],
})
export class DatabaseModule {}
