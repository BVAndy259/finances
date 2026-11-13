export const TRANSACTION_TYPES = [
  'INGRESO',
  'EGRESO',
  'TRANSFERENCIA_SALIDA',
  'TRANSFERENCIA_ENTRADA',
  'EGRESO_PRESTAMO',
  'INGRESO_COBRO',
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const LOAN_STATUSES = [
  'PENDIENTE',
  'PAGO_PARCIAL',
  'PAGADO',
] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

export interface ApiError {
  statusCode: number;
  message: string;
}
