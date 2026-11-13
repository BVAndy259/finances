import { Injectable } from '@nestjs/common';
import { AppUser, BusinessRuleError } from '@expense-tracker/core';
import { AppUserEntity } from '../entities/app-user.entity';

@Injectable()
export class AppUserMapper {
  toDomain(entity: AppUserEntity): AppUser {
    if (!entity.email && !entity.telegramChatId) {
      throw new BusinessRuleError(
        `El usuario ${entity.id} no tiene email ni telegram_chat_id`,
      );
    }

    const user = new AppUser();
    user.id = entity.id;
    user.email = entity.email;
    user.passwordHash = entity.passwordHash;
    user.refreshTokenHash = entity.refreshTokenHash;
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
    entity.email = domain.email;
    entity.passwordHash = domain.passwordHash;
    entity.refreshTokenHash = domain.refreshTokenHash;
    entity.telegramChatId = domain.telegramChatId;
    entity.alias = domain.alias;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
