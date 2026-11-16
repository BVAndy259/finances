import { Injectable } from '@nestjs/common';
import { AppUser, BusinessRuleError } from '@expense-tracker/core';
import { AppUserEntity } from '../entities/app-user.entity';

@Injectable()
export class AppUserMapper {
  toDomain(entity: AppUserEntity): AppUser {
    if (!entity.telegramChatId) {
      throw new BusinessRuleError(
        `El usuario ${entity.id} no tiene telegram_chat_id`,
      );
    }

    const user = new AppUser();
    user.id = Number(entity.id);
    user.telegramChatId = entity.telegramChatId;
    user.alias = entity.alias ?? '';
    user.createdAt = entity.createdAt ?? new Date();
    return user;
  }

  toEntity(domain: AppUser): AppUserEntity {
    const entity = new AppUserEntity();
    if (domain.id !== undefined) {
      entity.id = domain.id;
    }
    entity.telegramChatId = domain.telegramChatId;
    entity.alias = domain.alias;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
