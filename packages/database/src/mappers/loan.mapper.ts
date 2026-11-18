import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  BusinessRuleError,
  Loan,
  LoanStatus,
} from '@expense-tracker/core';
import { AccountEntity } from '../entities/account.entity';
import { AppUserEntity } from '../entities/app-user.entity';
import { LoanEntity } from '../entities/loan.entity';

@Injectable()
export class LoanMapper {
  toDomain(entity: LoanEntity): Loan {
    if (!entity.user?.id) {
      throw new BusinessRuleError(`El préstamo ${entity.id} no tiene usuario`);
    }

    if (!entity.account?.id) {
      throw new BusinessRuleError(`El préstamo ${entity.id} no tiene cuenta`);
    }

    const loan = new Loan();
    loan.id = entity.id;
    loan.userId = entity.user.id;
    loan.accountId = entity.account.id;
    loan.debtorName = entity.debtorName ?? '';
    loan.description = entity.description ?? null;
    loan.amount = entity.amount;
    loan.paidAmount = entity.paidAmount ?? new Decimal(0);
    loan.dueDate = entity.dueDate;
    loan.status = (entity.status as LoanStatus | null) ?? 'PENDIENTE';
    loan.loanDate = entity.loanDate ?? new Date();
    return loan;
  }

  toEntity(
    domain: Loan,
    userRef: AppUserEntity,
    accountRef: AccountEntity,
  ): LoanEntity {
    const entity = new LoanEntity();
    if (domain.id !== undefined) {
      entity.id = domain.id;
    }
    entity.user = userRef;
    entity.account = accountRef;
    entity.debtorName = domain.debtorName;
    entity.description = domain.description ?? null;
    entity.amount = domain.amount;
    entity.paidAmount = domain.paidAmount;
    entity.dueDate = domain.dueDate;
    entity.status = domain.status;
    entity.loanDate = domain.loanDate;
    return entity;
  }
}
