import Decimal from 'decimal.js';
import { Loan } from './loan';

describe('Loan', () => {
  it('calcula el monto restante a partir de amount y paidAmount', () => {
    const loan = new Loan();
    loan.amount = new Decimal('100.00');
    loan.paidAmount = new Decimal('30.00');

    expect(loan.remainingAmount.toFixed(2)).toBe('70.00');
  });

  it('usa cero cuando paidAmount no está definido', () => {
    const loan = new Loan();
    loan.amount = new Decimal('50.00');
    loan.paidAmount = undefined as unknown as Decimal;

    expect(loan.remainingAmount.toFixed(2)).toBe('50.00');
  });
});
