import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Loan, LoanRepositoryPort } from '@expense-tracker/core';
import { AccountEntity } from '../entities/account.entity';
import { AppUserEntity } from '../entities/app-user.entity';
import { LoanEntity } from '../entities/loan.entity';
import { LoanMapper } from '../mappers/loan.mapper';
import { TypeOrmContext } from '../typeorm-context';

@Injectable()
export class LoanRepositoryAdapter implements LoanRepositoryPort {
  constructor(
    private readonly context: TypeOrmContext,
    private readonly mapper: LoanMapper,
  ) {}

  async save(loan: Loan): Promise<Loan> {
    const repository = this.context.manager.getRepository(LoanEntity);
    const userRef = { id: loan.userId } as AppUserEntity;
    const accountRef = { id: loan.accountId } as AccountEntity;
    const saved = await repository.save(
      this.mapper.toEntity(loan, userRef, accountRef),
    );
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<Loan | null> {
    const repository = this.context.manager.getRepository(LoanEntity);
    const entity = await repository.findOne({
      where: { id },
      relations: { user: true, account: true },
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByUserIdAndStatusIn(
    userId: string,
    statuses: string[],
  ): Promise<Loan[]> {
    const repository = this.context.manager.getRepository(LoanEntity);
    const entities = await repository.find({
      where: {
        user: { id: userId },
        status: In(statuses),
      },
      relations: { user: true, account: true },
      order: { loanDate: 'ASC' },
    });
    return entities.map((entity) => this.mapper.toDomain(entity));
  }
}
