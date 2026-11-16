import { normalizeDatabaseUrl } from './database-url';

export interface AppConfiguration {
  databaseUrl: string;
  databaseLogging: string;
  botToken: string;
  botUsername: string;
  botEnabled: boolean;
  port: number;
}

export default (): AppConfiguration => ({
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL) ?? '',
  databaseLogging: process.env.DB_LOGGING ?? 'false',
  botToken: process.env.BOT_TOKEN ?? '',
  botUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'kratos_finanzas_bot',
  botEnabled: process.env.BOT_ENABLED !== 'false',
  port: Number.parseInt(process.env.PORT ?? '8080', 10),
});
