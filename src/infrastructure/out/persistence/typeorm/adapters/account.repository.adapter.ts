import { Injectable } from '@nestjs/common';
import { Account } from '../../../../../domain/model/account';
import { AccountRepositoryPort } from '../../../../../domain/port/out/account.repository.port';
import { AccountEntity } from '../entities/account.entity';
import { AppUserEntity } from '../entities/app-user.entity';
import { AccountMapper } from '../mappers/account.mapper';
import { TypeOrmContext } from '../typeorm-context';

@Injectable()
export class AccountRepositoryAdapter implements AccountRepositoryPort {
  constructor(
    private readonly context: TypeOrmContext,
    private readonly mapper: AccountMapper,
  ) {}

  async save(account: Account): Promise<Account> {
    const repository = this.context.manager.getRepository(AccountEntity);
    const userRef = { id: account.userId } as AppUserEntity;
    const saved = await repository.save(this.mapper.toEntity(account, userRef));
    return this.mapper.toDomain(saved);
  }

  async findById(id: number): Promise<Account | null> {
    const repository = this.context.manager.getRepository(AccountEntity);
    const entity = await repository.findOne({
      where: { id },
      relations: { user: true },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByUserId(userId: number): Promise<Account[]> {
    const repository = this.context.manager.getRepository(AccountEntity);
    const entities = await repository.find({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    return entities.map((entity) => this.mapper.toDomain(entity));
  }
}
