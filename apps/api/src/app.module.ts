import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationModule } from './application/application.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { BotModule } from './interfaces/bot/bot.module';
import { PingController } from './interfaces/controllers/ping.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ApplicationModule,
    BotModule,
  ],
  controllers: [PingController],
})
export class AppModule {}
