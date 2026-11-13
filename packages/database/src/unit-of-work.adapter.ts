import { Inject, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntityManager } from 'typeorm';
import { UnitOfWorkPort } from '@expense-tracker/core';
import { TYPEORM_ASYNC_STORAGE } from './typeorm.constants';

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWorkPort {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(TYPEORM_ASYNC_STORAGE)
    private readonly storage: AsyncLocalStorage<EntityManager>,
  ) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) =>
      this.storage.run(manager, work),
    );
  }
}
