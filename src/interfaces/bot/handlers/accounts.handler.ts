import { Injectable } from '@nestjs/common';
import { AccountService } from '../../../application/usecase/account.service';
import { formatAmount, getMessageText, resetSession } from '../bot.helpers';
import { BotAccountHelper } from '../bot-account.helper';
import { BotState } from '../bot-state.enum';
import { BotContext } from '../bot.types';

@Injectable()
export class AccountsHandler {
  constructor(
    private readonly accountService: AccountService,
    private readonly accountHelper: BotAccountHelper,
  ) {}

  async list(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    const accounts = await this.accountService.getAccountsByUser(user);
    const lines = accounts
      .map(
        (account) => `- ${account.name}: S/ ${formatAmount(account.balance)}`,
      )
      .join('\n');

    await ctx.reply(`Tus cuentas actuales:\n\n${lines}`);
  }

  async startCreate(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    ctx.session.state = BotState.WaitingAccountName;
    await ctx.reply(
      'Vamos a crear una nueva cuenta.\n¿Cómo se llama? (Ej: Yape, BCP, Efectivo):',
    );
  }

  async onCreateName(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    if (!user) {
      return;
    }

    const name = getMessageText(ctx);
    if (!name) {
      return;
    }

    await this.accountService.createAccount(user, name);
    resetSession(ctx);
    await ctx.reply(`¡Cuenta '${name}' creada con éxito!`);
  }
}
