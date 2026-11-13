import { Injectable } from '@nestjs/common';
import { Transaction, TransactionRepositoryPort } from '@expense-tracker/core';
import { AccountEntity } from '../entities/account.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { TypeOrmContext } from '../typeorm-context';

@Injectable()
export class TransactionRepositoryAdapter implements TransactionRepositoryPort {
  constructor(
    private readonly context: TypeOrmContext,
    private readonly mapper: TransactionMapper,
  ) {}

  async save(transaction: Transaction): Promise<Transaction> {
    const repository = this.context.manager.getRepository(TransactionEntity);
    const accountRef = { id: transaction.accountId } as AccountEntity;
    const saved = await repository.save(
      this.mapper.toEntity(transaction, accountRef),
    );
    return this.mapper.toDomain(saved);
  }

  async findByAccountId(accountId: number): Promise<Transaction[]> {
    const repository = this.context.manager.getRepository(TransactionEntity);
    const entities = await repository.find({
      where: { account: { id: accountId } },
      relations: { account: true },
    });
    return entities.map((entity) => this.mapper.toDomain(entity));
  }
}
