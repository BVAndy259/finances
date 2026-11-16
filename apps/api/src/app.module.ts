import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationModule } from './application/application.module';
import { AuthModule } from './auth.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { BotModule } from './interfaces/bot/bot.module';
import { AccountsController } from './interfaces/controllers/accounts.controller';
import { DashboardController } from './interfaces/controllers/dashboard.controller';
import { HealthController } from './interfaces/controllers/health.controller';
import { LoansController } from './interfaces/controllers/loans.controller';
import { PingController } from './interfaces/controllers/ping.controller';
import { TransactionsController } from './interfaces/controllers/transactions.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    ApplicationModule,
    AuthModule,
    BotModule,
  ],
  controllers: [
    PingController,
    AccountsController,
    TransactionsController,
    LoansController,
    DashboardController,
    HealthController,
  ],
})
export class AppModule {}
