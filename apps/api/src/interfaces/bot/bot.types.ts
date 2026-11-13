import Decimal from 'decimal.js';
import { Context, SessionFlavor } from 'grammy';
import { BotState } from './bot-state.enum';

export const BOT = Symbol('BOT');

export interface BotSessionData {
  state?: BotState;
  amount?: Decimal;
  paymentAmount?: Decimal;
  accountName?: string;
  originAccount?: string;
  destinationAccount?: string;
  debtor?: string;
  loanDescription?: string;
  loanId?: string;
}

export type BotContext = Context & SessionFlavor<BotSessionData>;
