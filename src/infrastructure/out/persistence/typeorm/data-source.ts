import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { normalizeDatabaseUrl } from '../../../../config/database-url';
import { typeOrmEntities } from './entities';

export default new DataSource({
  type: 'postgres',
  url: normalizeDatabaseUrl(process.env.DATABASE_URL),
  entities: typeOrmEntities,
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
