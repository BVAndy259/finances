import { Injectable } from '@nestjs/common';
import { Account, BusinessRuleError } from '@expense-tracker/core';
import { AccountEntity } from '../entities/account.entity';
import { AppUserEntity } from '../entities/app-user.entity';

@Injectable()
export class AccountMapper {
  toDomain(entity: AccountEntity): Account {
    if (!entity.user?.id) {
      throw new BusinessRuleError(`La cuenta ${entity.id} no tiene usuario`);
    }

    const account = new Account();
    account.id = entity.id;
    account.userId = entity.user.id;
    account.name = entity.name ?? '';
    account.balance = entity.balance;
    account.currency = entity.currency ?? 'PEN';
    account.createdAt = entity.createdAt ?? new Date();
    return account;
  }

  toEntity(domain: Account, userRef: AppUserEntity): AccountEntity {
    const entity = new AccountEntity();
    if (domain.id !== undefined) {
      entity.id = domain.id;
    }
    entity.user = userRef;
    entity.name = domain.name;
    entity.balance = domain.balance;
    entity.currency = domain.currency;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
