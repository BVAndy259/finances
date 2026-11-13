import {
  BadRequestException,
  ConflictException,
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
  LOAN_REPOSITORY,
  LoanRepositoryPort,
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from '@expense-tracker/core';

export interface UpdateAccountInput {
  name?: string;
  currency?: string;
}

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepository: LoanRepositoryPort,
  ) {}

  async createAccount(
    user: AppUser,
    accountName: string,
    currency = 'PEN',
  ): Promise<Account> {
    const name = this.normalizeName(accountName);

    const newAccount = new Account();
    newAccount.userId = user.id!;
    newAccount.name = name;
    newAccount.balance = new Decimal(0);
    newAccount.currency = this.normalizeCurrency(currency);
    return this.accountRepository.save(newAccount);
  }

  getAccountsByUser(user: AppUser): Promise<Account[]> {
    return this.accountRepository.findByUserId(user.id!);
  }

  async getAccountForUser(user: AppUser, accountId: string): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);

    if (!account || account.userId !== user.id) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return account;
  }

  async updateAccount(
    user: AppUser,
    accountId: string,
    input: UpdateAccountInput,
  ): Promise<Account> {
    const account = await this.getAccountForUser(user, accountId);

    if (input.name !== undefined) {
      account.name = this.normalizeName(input.name);
    }

    if (input.currency !== undefined) {
      account.currency = this.normalizeCurrency(input.currency);
    }

    return this.accountRepository.save(account);
  }

  async deleteAccount(user: AppUser, accountId: string): Promise<void> {
    const account = await this.getAccountForUser(user, accountId);

    const hasTransactions = await this.transactionRepository.existsByAccountId(
      account.id!,
    );
    const hasLoans = await this.loanRepository.existsByAccountId(account.id!);

    if (hasTransactions || hasLoans) {
      throw new ConflictException(
        'No se puede eliminar una cuenta con transacciones o préstamos asociados',
      );
    }

    await this.accountRepository.delete(account.id!);
  }

  async getTotalBalance(user: AppUser): Promise<Decimal> {
    const accounts = await this.getAccountsByUser(user);
    return accounts.reduce(
      (total, account) => total.add(account.balance),
      new Decimal(0),
    );
  }

  private normalizeName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('El nombre de la cuenta es obligatorio');
    }
    return trimmed;
  }

  private normalizeCurrency(currency: string): string {
    return currency.trim().toUpperCase();
  }
}
