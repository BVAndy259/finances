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
export class TransferHandler {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly accountHelper: BotAccountHelper,
  ) {}

  async start(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    const accounts = await this.accountHelper.getAccounts(user);
    if (accounts.length < 2) {
      await ctx.reply(
        'Necesitas al menos 2 cuentas para hacer una transferencia.',
      );
      return;
    }

    ctx.session.state = BotState.WaitingTransferOrigin;
    await sendAccountList(
      ctx,
      accounts,
      '¿De qué cuenta saldrá el dinero? (ORIGEN)',
    );
  }

  async onOrigin(ctx: BotContext): Promise<void> {
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

    ctx.session.originAccount = account.name;
    ctx.session.state = BotState.WaitingTransferDestination;
    const accounts = await this.accountHelper.getAccounts(user);
    await sendAccountList(
      ctx,
      accounts,
      '¿A qué cuenta irá el dinero? (DESTINO)',
    );
  }

  async onDestination(ctx: BotContext): Promise<void> {
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

    if (account.name === ctx.session.originAccount) {
      await ctx.reply(
        'No puedes transferir a la misma cuenta de origen. Escribe otra cuenta destino:',
      );
      return;
    }

    ctx.session.destinationAccount = account.name;
    ctx.session.state = BotState.WaitingTransferAmount;
    await ctx.reply(
      `Moviendo de ${ctx.session.originAccount} a ${account.name}\n¿Cuánto vas a transferir? (Ej: 100.00)`,
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
    ctx.session.state = BotState.WaitingTransferDescription;
    await ctx.reply(
      `Monto: S/${formatAmount(amount)}\n¿Motivo de la transferencia?`,
    );
  }

  async onDescription(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    const description = getMessageText(ctx);
    const { amount, originAccount, destinationAccount } = ctx.session;

    if (
      !user ||
      !description ||
      !amount ||
      !originAccount ||
      !destinationAccount
    ) {
      resetSession(ctx);
      return;
    }

    const origin = await this.accountHelper.findAccount(user, originAccount);
    const destination = await this.accountHelper.findAccount(
      user,
      destinationAccount,
    );

    if (!origin || !destination) {
      resetSession(ctx);
      await ctx.reply('Alguna de las cuentas ya no existe.');
      return;
    }

    try {
      await this.transactionService.transfer(
        origin,
        destination,
        amount,
        description,
        'Bot',
      );
      await ctx.reply('Transferencia completada.');
    } catch (error) {
      await ctx.reply(`Error: ${getErrorMessage(error)}`);
    } finally {
      resetSession(ctx);
    }
  }
}
