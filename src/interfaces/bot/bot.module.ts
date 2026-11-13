import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import { ApplicationModule } from '../../application/application.module';
import { AccountsHandler } from './handlers/accounts.handler';
import { CancelHandler } from './handlers/cancel.handler';
import { ExpenseHandler } from './handlers/expense.handler';
import { HelpHandler } from './handlers/help.handler';
import { IncomeHandler } from './handlers/income.handler';
import { LoanHandler } from './handlers/loan.handler';
import { StartHandler } from './handlers/start.handler';
import { TransferHandler } from './handlers/transfer.handler';
import { BotAccountHelper } from './bot-account.helper';
import { BOT, BotContext } from './bot.types';
import { BotUpdate } from './bot.update';

@Module({
  imports: [ApplicationModule, ConfigModule],
  providers: [
    {
      provide: BOT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const enabled = config.get<boolean>('botEnabled') ?? true;
        const token = config.get<string>('botToken');
        return new Bot<BotContext>(token || (enabled ? '' : '0:disabled'));
      },
    },
    BotAccountHelper,
    StartHandler,
    HelpHandler,
    CancelHandler,
    AccountsHandler,
    ExpenseHandler,
    IncomeHandler,
    TransferHandler,
    LoanHandler,
    BotUpdate,
  ],
})
export class BotModule {}
