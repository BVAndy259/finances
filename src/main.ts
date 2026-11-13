import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 8080;

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
