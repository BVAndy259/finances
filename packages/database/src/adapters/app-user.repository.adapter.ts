import { Injectable } from '@nestjs/common';
import { AppUser, AppUserRepositoryPort } from '@expense-tracker/core';
import { AppUserEntity } from '../entities/app-user.entity';
import { AppUserMapper } from '../mappers/app-user.mapper';
import { TypeOrmContext } from '../typeorm-context';

@Injectable()
export class AppUserRepositoryAdapter implements AppUserRepositoryPort {
  constructor(
    private readonly context: TypeOrmContext,
    private readonly mapper: AppUserMapper,
  ) {}

  async save(user: AppUser): Promise<AppUser> {
    const repository = this.context.manager.getRepository(AppUserEntity);
    const saved = await repository.save(this.mapper.toEntity(user));
    return this.mapper.toDomain(saved);
  }

  async findAll(): Promise<AppUser[]> {
    const repository = this.context.manager.getRepository(AppUserEntity);
    const entities = await repository.find({ order: { createdAt: 'ASC' } });
    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  async findById(id: string): Promise<AppUser | null> {
    const repository = this.context.manager.getRepository(AppUserEntity);
    const entity = await repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<AppUser | null> {
    const repository = this.context.manager.getRepository(AppUserEntity);
    const entity = await repository.findOne({ where: { email } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByTelegramChatId(telegramChatId: string): Promise<AppUser | null> {
    const repository = this.context.manager.getRepository(AppUserEntity);
    const entity = await repository.findOne({ where: { telegramChatId } });
    return entity ? this.mapper.toDomain(entity) : null;
  }
}
