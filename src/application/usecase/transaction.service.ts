import { Inject, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { BusinessRuleError } from '../../domain/errors/business-rule.error';
import { Account } from '../../domain/model/account';
import { Transaction } from '../../domain/model/transaction';
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../domain/port/out/account.repository.port';
import {
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from '../../domain/port/out/transaction.repository.port';
import {
  UNIT_OF_WORK,
  UnitOfWorkPort,
} from '../../domain/port/out/unit-of-work.port';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  registerExpense(
    account: Account,
    amount: Decimal,
    description: string,
    location: string,
  ): Promise<Transaction> {
    return this.unitOfWork.run(async () => {
      if (account.balance.lt(amount)) {
        throw new BusinessRuleError(
          'Saldo insuficiente en la cuenta: ' + account.name,
        );
      }

      account.balance = account.balance.sub(amount);
      await this.accountRepository.save(account);

      return this.transactionRepository.save(
        this.buildTransaction(account, 'EGRESO', amount, description, location),
      );
    });
  }

  registerIncome(
    account: Account,
    amount: Decimal,
    description: string,
    location: string,
  ): Promise<Transaction> {
    return this.unitOfWork.run(async () => {
      account.balance = account.balance.add(amount);
      await this.accountRepository.save(account);

      return this.transactionRepository.save(
        this.buildTransaction(
          account,
          'INGRESO',
          amount,
          description,
          location,
        ),
      );
    });
  }

  transfer(
    originAccount: Account,
    destinationAccount: Account,
    amount: Decimal,
    description: string,
    location: string,
  ): Promise<void> {
    return this.unitOfWork.run(async () => {
      if (originAccount.balance.lt(amount)) {
        throw new BusinessRuleError(
          'Saldo insuficiente en la cuenta origen: ' + originAccount.name,
        );
      }

      originAccount.balance = originAccount.balance.sub(amount);
      await this.accountRepository.save(originAccount);

      destinationAccount.balance = destinationAccount.balance.add(amount);
      await this.accountRepository.save(destinationAccount);

      await this.transactionRepository.save(
        this.buildTransaction(
          originAccount,
          'TRANSFERENCIA_SALIDA',
          amount,
          `A ${destinationAccount.name}: ${description}`,
          location,
        ),
      );

      await this.transactionRepository.save(
        this.buildTransaction(
          destinationAccount,
          'TRANSFERENCIA_ENTRADA',
          amount,
          `De ${originAccount.name}: ${description}`,
          location,
        ),
      );
    });
  }

  private buildTransaction(
    account: Account,
    transactionType: Transaction['transactionType'],
    amount: Decimal,
    description: string,
    location: string,
  ): Transaction {
    const transaction = new Transaction();
    transaction.accountId = account.id!;
    transaction.transactionType = transactionType;
    transaction.amount = amount;
    transaction.description = description;
    transaction.location = location;
    return transaction;
  }
}
