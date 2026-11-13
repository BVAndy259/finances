import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, session } from 'grammy';
import { resetSession } from './bot.helpers';
import { BotState } from './bot-state.enum';
import { BOT, BotContext, BotSessionData } from './bot.types';
import { AccountsHandler } from './handlers/accounts.handler';
import { CancelHandler } from './handlers/cancel.handler';
import { ExpenseHandler } from './handlers/expense.handler';
import { HelpHandler } from './handlers/help.handler';
import { IncomeHandler } from './handlers/income.handler';
import { LoanHandler } from './handlers/loan.handler';
import { StartHandler } from './handlers/start.handler';
import { TransferHandler } from './handlers/transfer.handler';

@Injectable()
export class BotUpdate implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    @Inject(BOT) private readonly bot: Bot<BotContext>,
    private readonly configService: ConfigService,
    private readonly startHandler: StartHandler,
    private readonly helpHandler: HelpHandler,
    private readonly cancelHandler: CancelHandler,
    private readonly accountsHandler: AccountsHandler,
    private readonly expenseHandler: ExpenseHandler,
    private readonly incomeHandler: IncomeHandler,
    private readonly transferHandler: TransferHandler,
    private readonly loanHandler: LoanHandler,
  ) {}

  onModuleInit(): void {
    this.bot.use(session({ initial: (): BotSessionData => ({}) }));
    this.registerHandlers();

    if (!this.configService.get<boolean>('botEnabled')) {
      this.logger.log('Bot de Telegram deshabilitado (BOT_ENABLED=false)');
      return;
    }

    void this.bot
      .start({
        onStart: (info) => this.logger.log(`Bot @${info.username} iniciado`),
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`No se pudo iniciar el bot: ${message}`);
      });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.configService.get<boolean>('botEnabled') && this.bot.isRunning()) {
      await this.bot.stop();
    }
  }

  private registerHandlers(): void {
    this.bot.command('cancelar', (ctx) => this.cancelHandler.handle(ctx));

    this.bot.on('message:text', async (ctx, next) => {
      if (ctx.session.state) {
        await this.routeState(ctx);
        return;
      }
      await next();
    });

    this.bot.command('start', (ctx) => this.startHandler.handle(ctx));
    this.bot.command('comandos', (ctx) => this.helpHandler.handle(ctx));
    this.bot.command('saldo', (ctx) => this.startHandler.balance(ctx));
    this.bot.command('cuentas', (ctx) => this.accountsHandler.list(ctx));
    this.bot.command('nuevacuenta', (ctx) =>
      this.accountsHandler.startCreate(ctx),
    );
    this.bot.command('gasto', (ctx) => this.expenseHandler.start(ctx));
    this.bot.command('ingreso', (ctx) => this.incomeHandler.start(ctx));
    this.bot.command('transferir', (ctx) => this.transferHandler.start(ctx));
    this.bot.command('prestar', (ctx) => this.loanHandler.startLoan(ctx));
    this.bot.command('cobrar', (ctx) => this.loanHandler.startCollect(ctx));
    this.bot.command('prestamos', (ctx) => this.loanHandler.listLoans(ctx));

    this.bot.on('message:text', (ctx) =>
      ctx.reply(
        'No entiendo ese mensaje. Por favor usa un comando de la lista /comandos.',
      ),
    );
  }

  private async routeState(ctx: BotContext): Promise<void> {
    switch (ctx.session.state) {
      case BotState.WaitingAccountName:
        return this.accountsHandler.onCreateName(ctx);
      case BotState.WaitingExpenseAccount:
        return this.expenseHandler.onAccount(ctx);
      case BotState.WaitingExpenseAmount:
        return this.expenseHandler.onAmount(ctx);
      case BotState.WaitingExpenseDescription:
        return this.expenseHandler.onDescription(ctx);
      case BotState.WaitingIncomeAccount:
        return this.incomeHandler.onAccount(ctx);
      case BotState.WaitingIncomeAmount:
        return this.incomeHandler.onAmount(ctx);
      case BotState.WaitingIncomeDescription:
        return this.incomeHandler.onDescription(ctx);
      case BotState.WaitingTransferOrigin:
        return this.transferHandler.onOrigin(ctx);
      case BotState.WaitingTransferDestination:
        return this.transferHandler.onDestination(ctx);
      case BotState.WaitingTransferAmount:
        return this.transferHandler.onAmount(ctx);
      case BotState.WaitingTransferDescription:
        return this.transferHandler.onDescription(ctx);
      case BotState.WaitingLoanAccount:
        return this.loanHandler.onAccount(ctx);
      case BotState.WaitingLoanAmount:
        return this.loanHandler.onAmount(ctx);
      case BotState.WaitingLoanDebtor:
        return this.loanHandler.onDebtor(ctx);
      case BotState.WaitingLoanDescription:
        return this.loanHandler.onDescription(ctx);
      case BotState.WaitingLoanDueDate:
        return this.loanHandler.onDueDate(ctx);
      case BotState.WaitingLoanId:
        return this.loanHandler.onLoanId(ctx);
      case BotState.WaitingPaymentAmount:
        return this.loanHandler.onPaymentAmount(ctx);
      case BotState.WaitingPaymentAccount:
        return this.loanHandler.onPaymentAccount(ctx);
      default:
        resetSession(ctx);
    }
  }
}
