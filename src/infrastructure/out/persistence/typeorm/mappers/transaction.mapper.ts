import { Injectable } from '@nestjs/common';
import { BusinessRuleError } from '../../../../../domain/errors/business-rule.error';
import {
  Transaction,
  TransactionType,
} from '../../../../../domain/model/transaction';
import { AccountEntity } from '../entities/account.entity';
import { TransactionEntity } from '../entities/transaction.entity';

@Injectable()
export class TransactionMapper {
  toDomain(entity: TransactionEntity): Transaction {
    if (!entity.account?.id) {
      throw new BusinessRuleError(
        `La transacción ${entity.id} no tiene cuenta`,
      );
    }

    if (!entity.transactionType) {
      throw new BusinessRuleError(`La transacción ${entity.id} no tiene tipo`);
    }

    const transaction = new Transaction();
    transaction.id = Number(entity.id);
    transaction.accountId = Number(entity.account.id);
    transaction.transactionType = entity.transactionType as TransactionType;
    transaction.amount = entity.amount;
    transaction.description = entity.description ?? '';
    transaction.location = entity.location ?? '';
    transaction.transactionDate = entity.transactionDate ?? new Date();
    return transaction;
  }

  toEntity(domain: Transaction, accountRef: AccountEntity): TransactionEntity {
    const entity = new TransactionEntity();
    if (domain.id !== undefined) {
      entity.id = domain.id;
    }
    entity.account = accountRef;
    entity.transactionType = domain.transactionType;
    entity.amount = domain.amount;
    entity.description = domain.description;
    entity.location = domain.location;
    entity.transactionDate = domain.transactionDate;
    return entity;
  }
}
