export interface AppConfiguration {
  botToken: string;
  botUsername: string;
  botEnabled: boolean;
  port: number;
  jwtAccessSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  cookieSecure: boolean;
  corsOrigins: string;
}

export default (): AppConfiguration => ({
  botToken: process.env.BOT_TOKEN ?? '',
  botUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'kratos_finanzas_bot',
  botEnabled: process.env.BOT_ENABLED !== 'false',
  port: Number.parseInt(process.env.PORT ?? '8080', 10),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  corsOrigins: process.env.CORS_ORIGINS ?? 'http://localhost:3000',
});
