export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing: string[] = [];

  const botDisabled =
    String(config.BOT_ENABLED ?? 'true').toLowerCase() === 'false';

  if (!botDisabled && !config.BOT_TOKEN) {
    missing.push('BOT_TOKEN');
  }

  if (!config.JWT_ACCESS_SECRET) {
    missing.push('JWT_ACCESS_SECRET');
  }

  if (!config.JWT_REFRESH_SECRET) {
    missing.push('JWT_REFRESH_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`,
    );
  }

  return config;
}
