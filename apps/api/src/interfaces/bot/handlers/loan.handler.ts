import { Injectable } from '@nestjs/common';
import { format, isMatch, parse } from 'date-fns';
import Decimal from 'decimal.js';
import { LoanService } from '../../../application/usecase/loan.service';
import { Loan } from '@expense-tracker/core';
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
export class LoanHandler {
  constructor(
    private readonly loanService: LoanService,
    private readonly accountHelper: BotAccountHelper,
  ) {}

  async startLoan(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    ctx.session.state = BotState.WaitingLoanAccount;
    const accounts = await this.accountHelper.getAccounts(user);
    await sendAccountList(
      ctx,
      accounts,
      '¿De qué cuenta saldrá el dinero para prestar?',
    );
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
    ctx.session.state = BotState.WaitingLoanAmount;
    await ctx.reply(`¿Cuánto vas a prestar de ${account.name}? (Ej: 30.00)`);
  }

  async onAmount(ctx: BotContext): Promise<void> {
    const text = getMessageText(ctx);
    const amount = text ? parseAmount(text) : null;
    if (!amount) {
      await ctx.reply('Por favor, ingresa solo números (Ej: 20.00).');
      return;
    }

    ctx.session.amount = amount;
    ctx.session.state = BotState.WaitingLoanDebtor;
    await ctx.reply(
      `Monto: S/${formatAmount(amount)}\n¿A quién le prestas el dinero? (Ej: Juan)`,
    );
  }

  async onDebtor(ctx: BotContext): Promise<void> {
    const debtor = getMessageText(ctx);
    if (!debtor) {
      return;
    }

    ctx.session.debtor = debtor;
    ctx.session.state = BotState.WaitingLoanDescription;
    await ctx.reply('¿Motivo del préstamo? (Ej: Para el taxi)');
  }

  async onDescription(ctx: BotContext): Promise<void> {
    const description = getMessageText(ctx);
    if (!description) {
      return;
    }

    ctx.session.loanDescription = description;
    ctx.session.state = BotState.WaitingLoanDueDate;
    await ctx.reply(
      "¿Tiene fecha límite de pago? (Escribe en formato DD/MM/AAAA o responde 'NO')",
    );
  }

  async onDueDate(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    const text = getMessageText(ctx);
    const { amount, accountName, debtor, loanDescription } = ctx.session;

    if (!user || !text || !amount || !accountName || !debtor) {
      resetSession(ctx);
      return;
    }

    if (!loanDescription?.trim()) {
      ctx.session.state = BotState.WaitingLoanDescription;
      await ctx.reply('El motivo es obligatorio. ¿Motivo del préstamo? (Ej: Para el taxi)');
      return;
    }

    let dueDate: string | null = null;
    if (text.toUpperCase() !== 'NO') {
      if (!isMatch(text, 'dd/MM/yyyy')) {
        await ctx.reply(
          "Formato de fecha inválido. Usa DD/MM/AAAA (Ej: 25/12/2026) o escribe 'NO'.",
        );
        return;
      }
      dueDate = format(parse(text, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd');
    }

    const account = await this.accountHelper.findAccount(user, accountName);
    if (!account) {
      resetSession(ctx);
      await ctx.reply('Esa cuenta ya no existe.');
      return;
    }

    try {
      await this.loanService.grantLoan(
        account,
        amount,
        debtor,
        loanDescription.trim(),
        dueDate,
      );
      await ctx.reply(
        `Prestaste S/${formatAmount(amount)} a ${debtor}. ¡Guardado en pendientes!`,
      );
    } catch (error) {
      await ctx.reply(`Error: ${getErrorMessage(error)}`);
    } finally {
      resetSession(ctx);
    }
  }

  async startCollect(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    const pendingLoans = await this.loanService.getPendingLoans(user);
    if (pendingLoans.length === 0) {
      await ctx.reply(
        'No tienes préstamos pendientes por cobrar. ¡Todos están al día!',
      );
      return;
    }

    const lines = pendingLoans
      .map(
        (loan, index) =>
          `${index + 1}) ${loan.debtorName} debe S/${formatAmount(loan.remainingAmount)}`,
      )
      .join('\n');

    ctx.session.state = BotState.WaitingLoanId;
    await ctx.reply(
      `Préstamos Pendientes:\n\n${lines}\n\nEscribe el número de la lista del préstamo que te están abonando:`,
    );
  }

  async listLoans(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.getUser(ctx);
    if (!user) {
      return;
    }

    const pendingLoans = await this.loanService.getPendingLoans(user);
    if (pendingLoans.length === 0) {
      await ctx.reply('No tienes préstamos por cobrar.');
      return;
    }

    let total = new Decimal(0);
    const lines = pendingLoans
      .map((loan) => {
        const dateInfo = loan.dueDate ? ` (Vence: ${loan.dueDate})` : '';
        total = total.add(loan.remainingAmount);
        return `- ${loan.debtorName}: S/${formatAmount(loan.remainingAmount)}${dateInfo}`;
      })
      .join('\n');

    await ctx.reply(
      `Lista de Préstamos:\n\n${lines}\n\nTotal de dinero prestado S/${formatAmount(total)}`,
    );
  }

  async onLoanId(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    const text = getMessageText(ctx);
    if (!user || !text) {
      return;
    }

    if (!/^\d+$/.test(text)) {
      await ctx.reply('Ingresa solo el número de la lista (Ej: 1).');
      return;
    }

    const position = Number.parseInt(text, 10);
    const pendingLoans = await this.loanService.getPendingLoans(user);
    const loan = pendingLoans[position - 1];

    if (!loan) {
      await ctx.reply(
        'Número inválido. Asegúrate de escribir el número correcto de la lista.',
      );
      return;
    }

    ctx.session.loanId = loan.id;
    ctx.session.state = BotState.WaitingPaymentAmount;
    await ctx.reply(
      `La deuda actual es de: S/${formatAmount(loan.remainingAmount)}\n¿Cuánto dinero te abonó hoy? (Ej: 15.00)`,
    );
  }

  async onPaymentAmount(ctx: BotContext): Promise<void> {
    const text = getMessageText(ctx);
    const paymentAmount = text ? parseAmount(text) : null;
    if (!paymentAmount) {
      await ctx.reply('Por favor, ingresa solo números (Ej: 20.00).');
      return;
    }

    ctx.session.paymentAmount = paymentAmount;
    ctx.session.state = BotState.WaitingPaymentAccount;

    const user = await this.accountHelper.requireUser(ctx);
    if (!user) {
      return;
    }

    const accounts = await this.accountHelper.getAccounts(user);
    await sendAccountList(
      ctx,
      accounts,
      '¿A qué cuenta ingresó el dinero que te devolvieron?',
    );
  }

  async onPaymentAccount(ctx: BotContext): Promise<void> {
    const user = await this.accountHelper.requireUser(ctx);
    const name = getMessageText(ctx);
    const { loanId, paymentAmount } = ctx.session;

    if (!user || !name || loanId === undefined || !paymentAmount) {
      resetSession(ctx);
      return;
    }

    const account = await this.accountHelper.findAccount(user, name);
    if (!account) {
      await ctx.reply('Esa cuenta no existe.');
      return;
    }

    try {
      const updatedLoan: Loan = await this.loanService.payLoan(
        loanId,
        account,
        paymentAmount,
      );

      if (updatedLoan.status === 'PAGADO') {
        await ctx.reply(
          '¡Cobro exitoso! El préstamo está marcado como PAGADO.',
        );
      } else {
        await ctx.reply(
          `¡Abono registrado! Aún te deben S/${formatAmount(updatedLoan.remainingAmount)}`,
        );
      }
    } catch (error) {
      await ctx.reply(`Error: ${getErrorMessage(error)}`);
    } finally {
      resetSession(ctx);
    }
  }
}
