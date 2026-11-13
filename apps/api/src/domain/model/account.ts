import Decimal from 'decimal.js';

export class Account {
  id?: number;
  userId!: number;
  name!: string;
  balance: Decimal = new Decimal(0);
  currency = 'PEN';
  createdAt: Date = new Date();
}
