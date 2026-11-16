import { Module } from '@nestjs/common';
import { AccountService } from './usecase/account.service';
import { AppUserService } from './usecase/app-user.service';
import { LoanService } from './usecase/loan.service';
import { TransactionService } from './usecase/transaction.service';
import { TypeOrmPersistenceModule } from '../infrastructure/out/persistence/typeorm/typeorm.module';

@Module({
  imports: [TypeOrmPersistenceModule],
  providers: [AppUserService, AccountService, TransactionService, LoanService],
  exports: [AppUserService, AccountService, TransactionService, LoanService],
})
export class ApplicationModule {}
