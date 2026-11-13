import { Injectable } from '@nestjs/common';
import { TransactionService } from '../../../application/usecase/transaction.service';
import {
  formatAmount,
  getErrorMessage,
  getMessageText,
  parseAmount,
  resetSession,
  sendAccountList,
} from '../bot.helpers';
import { BotAccountHelper } from '../bot-account.helper';
import { BotState } from '../bot-state.enum';
import { BotContext } from '../bot.types';

@Injectable()
export class IncomeHandler {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly accountHelper: BotAccountHelper,
  ) {}

  async start(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    ctx.session.state = BotState.WaitingIncomeAccount;
    const accounts = await this.accountHelper.getAccounts(user);
    await sendAccountList(ctx, accounts, '¿A qué cuenta ingresó el dinero?');
  }

  async onAccount(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    const name = getMessageText(ctx);
    if (!user || !name) {
      return;
    }

    const account = await this.accountHelper.findAccount(user, name);
    if (!account) {
      await ctx.reply(
        'Esa cuenta no existe. Escribe un nombre válido o usa /cancelar.',
      );
      return;
    }

    ctx.session.accountName = account.name;
    ctx.session.state = BotState.WaitingIncomeAmount;
    await ctx.reply(
      `Has seleccionado: ${account.name}\n¿Cuánto ingresó? (Ej: 50.00)`,
    );
  }

  async onAmount(ctx: BotContext): Promise<void> {
    const text = getMessageText(ctx);
    const amount = text ? parseAmount(text) : null;
    if (!amount) {
      await ctx.reply('Por favor, ingresa solo números (Ej: 20.00).');
      return;
    }

    ctx.session.amount = amount;
    ctx.session.state = BotState.WaitingIncomeDescription;
    await ctx.reply(`Monto: S/${formatAmount(amount)}\n¿De dónde proviene?`);
  }

  async onDescription(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    const description = getMessageText(ctx);
    const { amount, accountName } = ctx.session;

    if (!user || !description || !amount || !accountName) {
      resetSession(ctx);
      return;
    }

    const account = await this.accountHelper.findAccount(user, accountName);
    if (!account) {
      resetSession(ctx);
      await ctx.reply('Esa cuenta ya no existe.');
      return;
    }

    try {
      await this.transactionService.registerIncome(
        account,
        amount,
        description,
        'Bot',
      );
      await ctx.reply(`Ingreso de S/${formatAmount(amount)} registrado.`);
    } catch (error) {
      await ctx.reply(`Error: ${getErrorMessage(error)}`);
    } finally {
      resetSession(ctx);
    }
  }
}
