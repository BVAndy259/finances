export function formatCurrency(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;

  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const TRANSACTION_LABELS: Record<string, string> = {
  INGRESO: 'Ingreso',
  EGRESO: 'Egreso',
  TRANSFERENCIA_SALIDA: 'Transferencia enviada',
  TRANSFERENCIA_ENTRADA: 'Transferencia recibida',
  EGRESO_PRESTAMO: 'Préstamo otorgado',
  INGRESO_COBRO: 'Cobro de préstamo',
};

export function transactionLabel(type: string): string {
  return TRANSACTION_LABELS[type] ?? type;
}

const LOAN_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PAGO_PARCIAL: 'Pago parcial',
  PAGADO: 'Pagado',
};

export function loanStatusLabel(status: string): string {
  return LOAN_STATUS_LABELS[status] ?? status;
}
