export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing: string[] = [];

  if (!config.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  const botDisabled =
    String(config.BOT_ENABLED ?? 'true').toLowerCase() === 'false';

  if (!botDisabled && !config.BOT_TOKEN) {
    missing.push('BOT_TOKEN');
  }

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`,
    );
  }

  return config;
}
