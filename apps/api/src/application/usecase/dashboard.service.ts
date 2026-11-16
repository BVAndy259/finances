import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  AppUser,
  Loan,
  LOAN_REPOSITORY,
  LoanRepositoryPort,
  Transaction,
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
} from '@expense-tracker/core';

export interface DashboardSummary {
  month: string;
  from: Date;
  to: Date;
  accounts: Account[];
  totalBalance: Decimal;
  income: Decimal;
  expense: Decimal;
  net: Decimal;
  recentTransactions: Transaction[];
  pendingLoans: Loan[];
  pendingLoansTotal: Decimal;
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepository: LoanRepositoryPort,
  ) {}

  async getSummary(user: AppUser, month?: string): Promise<DashboardSummary> {
    const { from, to, label } = this.resolveMonthRange(month);
    const userId = user.id!;

    const [accounts, income, expense, recent, pendingLoans] = await Promise.all(
      [
        this.accountRepository.findByUserId(userId),
        this.transactionRepository.sumByUserIdAndTypes(
          userId,
          ['INGRESO'],
          from,
          to,
        ),
        this.transactionRepository.sumByUserIdAndTypes(
          userId,
          ['EGRESO'],
          from,
          to,
        ),
        this.transactionRepository.findByUserId(userId, { page: 1, limit: 5 }),
        this.loanRepository.findByUserIdAndStatusIn(userId, [
          'PENDIENTE',
          'PAGO_PARCIAL',
        ]),
      ],
    );

    const totalBalance = accounts.reduce(
      (total, account) => total.add(account.balance),
      new Decimal(0),
    );
    const pendingLoansTotal = pendingLoans.reduce(
      (total, loan) => total.add(loan.remainingAmount),
      new Decimal(0),
    );

    return {
      month: label,
      from,
      to,
      accounts,
      totalBalance,
      income,
      expense,
      net: income.sub(expense),
      recentTransactions: recent.items,
      pendingLoans,
      pendingLoansTotal,
    };
  }

  private resolveMonthRange(month?: string): {
    from: Date;
    to: Date;
    label: string;
  } {
    const now = new Date();
    let year = now.getUTCFullYear();
    let monthIndex = now.getUTCMonth();

    if (month !== undefined) {
      const match = MONTH_PATTERN.exec(month);
      if (!match) {
        throw new BadRequestException(
          'El mes debe tener el formato YYYY-MM (Ej: 2026-11)',
        );
      }

      year = Number.parseInt(match[1], 10);
      monthIndex = Number.parseInt(match[2], 10) - 1;
    }

    const from = new Date(Date.UTC(year, monthIndex, 1));
    const to = new Date(Date.UTC(year, monthIndex + 1, 1));
    const label = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    return { from, to, label };
  }
}
