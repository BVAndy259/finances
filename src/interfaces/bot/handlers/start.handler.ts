import { Injectable } from '@nestjs/common';
import { AccountService } from '../../../application/usecase/account.service';
import { AppUserService } from '../../../application/usecase/app-user.service';
import { formatAmount, getChatId } from '../bot.helpers';
import { BotAccountHelper } from '../bot-account.helper';
import { BotContext } from '../bot.types';

@Injectable()
export class StartHandler {
  constructor(
    private readonly appUserService: AppUserService,
    private readonly accountService: AccountService,
    private readonly accountHelper: BotAccountHelper,
  ) {}

  async handle(ctx: BotContext): Promise<void> {
    const chatId = getChatId(ctx);
    if (!chatId) {
      return;
    }

    const alias = ctx.from?.first_name ?? 'Usuario';
    const user = await this.appUserService.registerUserIfNotExists(
      chatId,
      alias,
    );

    const accounts = await this.accountService.getAccountsByUser(user);
    if (accounts.length === 0) {
      await this.accountService.createAccount(user, 'Efectivo');
    }

    await ctx.reply(
      `¡Hola, ${user.alias}! \nUsa /comandos para ver lo que puedo hacer.`,
      { reply_markup: { remove_keyboard: true } },
    );
  }

  async balance(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    const total = await this.accountService.getTotalBalance(user);

    await ctx.reply(`Tu saldo total en cuentas es: S/ ${formatAmount(total)}`);
  }
}
