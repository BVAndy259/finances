import Decimal from 'decimal.js';

export type TransactionType =
  | 'INGRESO'
  | 'EGRESO'
  | 'TRANSFERENCIA_SALIDA'
  | 'TRANSFERENCIA_ENTRADA'
  | 'EGRESO_PRESTAMO'
  | 'INGRESO_COBRO';

export class Transaction {
  id?: number;
  accountId!: number;
  transactionType!: TransactionType;
  amount!: Decimal;
  description!: string;
  location!: string;
  transactionDate: Date = new Date();
}
