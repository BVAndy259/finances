import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
  TransactionRepositoryPort,
  TransactionType,
} from '@expense-tracker/core';
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

  async findById(id: string): Promise<Transaction | null> {
    const repository = this.context.manager.getRepository(TransactionEntity);
    const entity = await repository.findOne({
      where: { id },
      relations: { account: true },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const repository = this.context.manager.getRepository(TransactionEntity);
    const entities = await repository.find({
      where: { account: { id: accountId } },
      relations: { account: true },
    });
    return entities.map((entity) => this.mapper.toDomain(entity));
  }

  async findByUserId(
    userId: string,
    filters: TransactionFilters,
  ): Promise<PaginatedTransactions> {
    const repository = this.context.manager.getRepository(TransactionEntity);

    const query = repository
      .createQueryBuilder('tx')
      .innerJoinAndSelect('tx.account', 'account')
      .innerJoin('account.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('tx.transactionDate', 'DESC')
      .addOrderBy('tx.id', 'DESC');

    if (filters.accountId) {
      query.andWhere('account.id = :accountId', {
        accountId: filters.accountId,
      });
    }

    if (filters.type) {
      query.andWhere('tx.transactionType = :type', { type: filters.type });
    }

    if (filters.from) {
      query.andWhere('tx.transactionDate >= :from', { from: filters.from });
    }

    if (filters.to) {
      query.andWhere('tx.transactionDate <= :to', { to: filters.to });
    }

    const [entities, total] = await query
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return {
      items: entities.map((entity) => this.mapper.toDomain(entity)),
      total,
    };
  }

  async existsByAccountId(accountId: string): Promise<boolean> {
    const repository = this.context.manager.getRepository(TransactionEntity);
    const count = await repository.count({
      where: { account: { id: accountId } },
    });
    return count > 0;
  }

  async sumByUserIdAndTypes(
    userId: string,
    types: TransactionType[],
    from: Date,
    to: Date,
  ): Promise<Decimal> {
    if (types.length === 0) {
      return new Decimal(0);
    }

    const repository = this.context.manager.getRepository(TransactionEntity);
    const result = await repository
      .createQueryBuilder('tx')
      .innerJoin('tx.account', 'account')
      .innerJoin('account.user', 'user')
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .where('user.id = :userId', { userId })
      .andWhere('tx.transactionType IN (:...types)', { types })
      .andWhere('tx.transactionDate >= :from', { from })
      .andWhere('tx.transactionDate < :to', { to })
      .getRawOne<{ total: string | null }>();

    return new Decimal(result?.total ?? 0);
  }
}
