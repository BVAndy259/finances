import { Inject, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  AppUser,
} from '@expense-tracker/core';

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
  ) {}

  createAccount(user: AppUser, accountName: string): Promise<Account> {
    const newAccount = new Account();
    newAccount.userId = user.id!;
    newAccount.name = accountName;
    newAccount.balance = new Decimal(0);
    return this.accountRepository.save(newAccount);
  }

  getAccountsByUser(user: AppUser): Promise<Account[]> {
    return this.accountRepository.findByUserId(user.id!);
  }

  async getTotalBalance(user: AppUser): Promise<Decimal> {
    const accounts = await this.getAccountsByUser(user);
    return accounts.reduce(
      (total, account) => total.add(account.balance),
      new Decimal(0),
    );
  }
}
