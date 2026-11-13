import { Inject, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntityManager } from 'typeorm';
import { TYPEORM_ASYNC_STORAGE } from './typeorm.constants';

@Injectable()
export class TypeOrmContext {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(TYPEORM_ASYNC_STORAGE)
    private readonly storage: AsyncLocalStorage<EntityManager>,
  ) {}

  get manager(): EntityManager {
    return this.storage.getStore() ?? this.dataSource.manager;
  }
}
