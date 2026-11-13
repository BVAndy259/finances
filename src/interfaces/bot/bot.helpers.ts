import Decimal from 'decimal.js';
import { Account } from '../../domain/model/account';
import { BotContext } from './bot.types';

export function getChatId(ctx: BotContext): string | null {
  return ctx.chat?.id !== undefined ? ctx.chat.id.toString() : null;
}

export function getMessageText(ctx: BotContext): string | null {
  return ctx.message?.text?.trim() ?? null;
}

export function parseAmount(text: string): Decimal | null {
  try {
    const amount = new Decimal(text);
    return amount.isFinite() ? amount : null;
  } catch {
    return null;
  }
}

export function formatAmount(value: Decimal | string | number): string {
  return new Decimal(value).toFixed(2);
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function resetSession(ctx: BotContext): void {
  ctx.session.state = undefined;
  ctx.session.amount = undefined;
  ctx.session.paymentAmount = undefined;
  ctx.session.accountName = undefined;
  ctx.session.originAccount = undefined;
  ctx.session.destinationAccount = undefined;
  ctx.session.debtor = undefined;
  ctx.session.loanDescription = undefined;
  ctx.session.loanId = undefined;
}

export async function sendAccountList(
  ctx: BotContext,
  accounts: Account[],
  question: string,
): Promise<void> {
  const list = accounts.map((account) => `- ${account.name}`).join('\n');
  await ctx.reply(
    `${question}\n\nTus cuentas son:\n${list}\n\nEscribe el nombre de la cuenta:`,
  );
}
