import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { BusinessRuleExceptionFilter } from './interfaces/filters/business-rule-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new BusinessRuleExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 8080;
  const corsOrigins = configService.get<string>('corsOrigins') ?? '';

  app.enableCors({
    origin: corsOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  });

  await app.listen(port);
  Logger.log(`Servidor escuchando en el puerto ${port}`, 'Bootstrap');
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  Logger.error(
    `No se pudo arrancar la aplicación: ${message}`,
    '',
    'Bootstrap',
  );
  process.exit(1);
});
