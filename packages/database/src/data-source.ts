import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from './entities';
import { getDatabaseUrl, isDatabaseLoggingEnabled } from './env';

export default new DataSource({
  type: 'postgres',
  url: getDatabaseUrl(),
  entities: typeOrmEntities,
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: isDatabaseLoggingEnabled(),
});
