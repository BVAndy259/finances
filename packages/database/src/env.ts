import { config } from 'dotenv';
import { join } from 'node:path';
import { normalizeDatabaseUrl } from './database-url';

let envLoaded = false;

function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  config({ path: join(__dirname, '../.env'), quiet: true });
  envLoaded = true;
}

export function getDatabaseUrl(): string {
  loadEnv();
  const url = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!url) {
    throw new Error(
      'Falta DATABASE_URL. Configúrala en packages/database/.env o en el entorno.',
    );
  }
  return url;
}

export function isDatabaseLoggingEnabled(): boolean {
  loadEnv();
  return process.env.DB_LOGGING === 'true';
}
