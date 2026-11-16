import { Module } from '@nestjs/common';
import { DatabaseModule } from '@expense-tracker/database';
import { AccountService } from './usecase/account.service';
import { AppUserService } from './usecase/app-user.service';
import { DashboardService } from './usecase/dashboard.service';
import { LoanService } from './usecase/loan.service';
import { TransactionService } from './usecase/transaction.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    AppUserService,
    AccountService,
    TransactionService,
    LoanService,
    DashboardService,
  ],
  exports: [
    AppUserService,
    AccountService,
    TransactionService,
    LoanService,
    DashboardService,
  ],
})
export class ApplicationModule {}
