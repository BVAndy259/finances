import Decimal from 'decimal.js';

export type LoanStatus = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADO';

export class Loan {
  id?: string;
  userId!: string;
  accountId!: string;
  debtorName!: string;
  description: string | null = null;
  amount!: Decimal;
  paidAmount: Decimal = new Decimal(0);
  dueDate: string | null = null;
  status: LoanStatus = 'PENDIENTE';
  loanDate: Date = new Date();

  get remainingAmount(): Decimal {
    return this.amount.sub(this.paidAmount ?? 0);
  }
}
