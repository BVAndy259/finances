import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  AppUser,
  BusinessRuleError,
  PaginatedTransactions,
  Transaction,
  TRANSACTION_REPOSITORY,
  TransactionFilters,
  TransactionRepositoryPort,
  UNIT_OF_WORK,
  UnitOfWorkPort,
} from '@expense-tracker/core';

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

  async registerExpenseForUser(
    user: AppUser,
    accountId: string,
    amount: Decimal,
    description: string,
    location: string,
  ): Promise<Transaction> {
    this.assertPositiveAmount(amount);
    const account = await this.requireAccount(user.id!, accountId);
    return this.registerExpense(account, amount, description, location);
  }

  async registerIncomeForUser(
    user: AppUser,
    accountId: string,
    amount: Decimal,
    description: string,
    location: string,
  ): Promise<Transaction> {
    this.assertPositiveAmount(amount);
    const account = await this.requireAccount(user.id!, accountId);
    return this.registerIncome(account, amount, description, location);
  }

  async transferForUser(
    user: AppUser,
    originAccountId: string,
    destinationAccountId: string,
    amount: Decimal,
    description: string,
    location: string,
  ): Promise<void> {
    this.assertPositiveAmount(amount);

    if (originAccountId === destinationAccountId) {
      throw new BadRequestException(
        'La cuenta origen y destino deben ser diferentes',
      );
    }

    const originAccount = await this.requireAccount(user.id!, originAccountId);
    const destinationAccount = await this.requireAccount(
      user.id!,
      destinationAccountId,
    );

    await this.transfer(
      originAccount,
      destinationAccount,
      amount,
      description,
      location,
    );
  }

  async listTransactions(
    user: AppUser,
    filters: TransactionFilters,
  ): Promise<PaginatedTransactions> {
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new BadRequestException(
        'La fecha "from" no puede ser mayor que "to"',
      );
    }

    return this.transactionRepository.findByUserId(user.id!, filters);
  }

  async getTransactionForUser(
    user: AppUser,
    transactionId: string,
  ): Promise<Transaction> {
    const transaction =
      await this.transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    await this.requireAccount(user.id!, transaction.accountId);
    return transaction;
  }

  private async requireAccount(
    userId: string,
    accountId: string,
  ): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return account;
  }

  private assertPositiveAmount(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
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
