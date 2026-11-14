import { Module } from '@nestjs/common';
import { DatabaseModule } from '@expense-tracker/database';
import { AccountService } from './usecase/account.service';
import { AppUserService } from './usecase/app-user.service';
import { DashboardService } from './usecase/dashboard.service';
import { HealthService } from './usecase/health.service';
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
    HealthService,
  ],
  exports: [
    AppUserService,
    AccountService,
    TransactionService,
    LoanService,
    DashboardService,
    HealthService,
  ],
})
export class ApplicationModule {}
