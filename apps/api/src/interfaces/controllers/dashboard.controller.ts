import { Controller, Get, Query } from '@nestjs/common';
import { Account, AppUser, Loan, Transaction } from '@expense-tracker/core';
import { DashboardService } from '../../application/usecase/dashboard.service';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { DashboardQueryDto } from './dto/dashboard.dto';

interface DashboardResponse {
  month: string;
  totalBalance: string;
  income: string;
  expense: string;
  net: string;
  accounts: Array<{
    id?: string;
    name: string;
    balance: string;
    currency: string;
  }>;
  recentTransactions: Array<{
    id?: string;
    accountId: string;
    transactionType: string;
    amount: string;
    description: string;
    location: string;
    transactionDate: Date;
  }>;
  loans: {
    total: string;
    count: number;
    items: Array<{
      id?: string;
      accountId: string;
      debtorName: string;
      description: string | null;
      amount: string;
      paidAmount: string;
      remainingAmount: string;
      dueDate: string | null;
      status: string;
      loanDate: Date;
    }>;
  };
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async summary(
    @CurrentUser() user: AppUser,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardResponse> {
    const summary = await this.dashboardService.getSummary(user, query.month);

    return {
      month: summary.month,
      totalBalance: summary.totalBalance.toString(),
      income: summary.income.toString(),
      expense: summary.expense.toString(),
      net: summary.net.toString(),
      accounts: summary.accounts.map((account) => this.toAccount(account)),
      recentTransactions: summary.recentTransactions.map((transaction) =>
        this.toTransaction(transaction),
      ),
      loans: {
        total: summary.pendingLoansTotal.toString(),
        count: summary.pendingLoans.length,
        items: summary.pendingLoans.map((loan) => this.toLoan(loan)),
      },
    };
  }

  private toAccount(account: Account): DashboardResponse['accounts'][number] {
    return {
      id: account.id,
      name: account.name,
      balance: account.balance.toString(),
      currency: account.currency,
    };
  }

  private toTransaction(
    transaction: Transaction,
  ): DashboardResponse['recentTransactions'][number] {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      description: transaction.description,
      location: transaction.location,
      transactionDate: transaction.transactionDate,
    };
  }

  private toLoan(loan: Loan): DashboardResponse['loans']['items'][number] {
    return {
      id: loan.id,
      accountId: loan.accountId,
      debtorName: loan.debtorName,
      description: loan.description ?? null,
      amount: loan.amount.toString(),
      paidAmount: loan.paidAmount.toString(),
      remainingAmount: loan.remainingAmount.toString(),
      dueDate: loan.dueDate,
      status: loan.status,
      loanDate: loan.loanDate,
    };
  }
}
