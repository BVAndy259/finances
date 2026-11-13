import { Injectable } from '@nestjs/common';
import { AccountService } from '../../application/usecase/account.service';
import { AppUserService } from '../../application/usecase/app-user.service';
import { Account } from '../../domain/model/account';
import { AppUser } from '../../domain/model/app-user';
import { getChatId, resetSession } from './bot.helpers';
import { BotContext } from './bot.types';

@Injectable()
export class BotAccountHelper {
  constructor(
    private readonly appUserService: AppUserService,
    private readonly accountService: AccountService,
  ) {}

  async getUser(ctx: BotContext): Promise<AppUser | null> {
    const chatId = getChatId(ctx);
    if (!chatId) {
      return null;
    }
    return this.appUserService.getUserByTelegramId(chatId);
  }

  async requireUser(ctx: BotContext): Promise<AppUser | null> {
    const user = await this.getUser(ctx);
    if (!user) {
      resetSession(ctx);
      await ctx.reply(
        'Primero usa /start para registrar tu usuario en el bot.',
      );
    }
    return user;
  }

  getAccounts(user: AppUser): Promise<Account[]> {
    return this.accountService.getAccountsByUser(user);
  }

  async findAccount(user: AppUser, rawName: string): Promise<Account | null> {
    const accounts = await this.getAccounts(user);
    const name = rawName.trim().toLowerCase();
    return (
      accounts.find((account) => account.name.trim().toLowerCase() === name) ??
      null
    );
  }
}
