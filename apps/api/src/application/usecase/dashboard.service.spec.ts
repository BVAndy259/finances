import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  AccountRepositoryPort,
  AppUser,
  Loan,
  LoanRepositoryPort,
  TransactionRepositoryPort,
} from '@expense-tracker/core';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let accounts: jest.Mocked<AccountRepositoryPort>;
  let transactions: jest.Mocked<TransactionRepositoryPort>;
  let loans: jest.Mocked<LoanRepositoryPort>;
  let user: AppUser;

  const buildAccount = (id: string, balance: string): Account => {
    const account = new Account();
    account.id = id;
    account.userId = 'user-1';
    account.name = 'Cuenta';
    account.balance = new Decimal(balance);
    return account;
  };

  const buildLoan = (amount: string, paidAmount: string): Loan => {
    const loan = new Loan();
    loan.id = 'loan-1';
    loan.userId = 'user-1';
    loan.accountId = 'account-1';
    loan.debtorName = 'Juan';
    loan.amount = new Decimal(amount);
    loan.paidAmount = new Decimal(paidAmount);
    loan.status = 'PAGO_PARCIAL';
    return loan;
  };

  beforeEach(() => {
    user = new AppUser();
    user.id = 'user-1';

    accounts = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    };

    transactions = {
      save: jest.fn(),
      findById: jest.fn(),
      findByAccountId: jest.fn(),
      findByUserId: jest.fn(),
      existsByAccountId: jest.fn(),
      sumByUserIdAndTypes: jest.fn(),
    };

    loans = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndStatusIn: jest.fn(),
      existsByAccountId: jest.fn(),
    };

    service = new DashboardService(accounts, transactions, loans);
  });

  it('calcula el resumen del mes actual', async () => {
    accounts.findByUserId.mockResolvedValue([
      buildAccount('account-1', '10.00'),
      buildAccount('account-2', '5.50'),
    ]);
    transactions.sumByUserIdAndTypes.mockImplementation(
      (_userId: string, types: string[]) =>
        Promise.resolve(
          new Decimal(types.includes('INGRESO') ? '100.00' : '25.00'),
        ),
    );
    transactions.findByUserId.mockResolvedValue({ items: [], total: 0 });
    loans.findByUserIdAndStatusIn.mockResolvedValue([
      buildLoan('100.00', '40.00'),
    ]);

    const summary = await service.getSummary(user);
    const now = new Date();
    const expectedMonth = `${now.getUTCFullYear()}-${String(
      now.getUTCMonth() + 1,
    ).padStart(2, '0')}`;

    expect(summary.month).toBe(expectedMonth);
    expect(summary.totalBalance.toFixed(2)).toBe('15.50');
    expect(summary.income.toFixed(2)).toBe('100.00');
    expect(summary.expense.toFixed(2)).toBe('25.00');
    expect(summary.net.toFixed(2)).toBe('75.00');
    expect(summary.pendingLoansTotal.toFixed(2)).toBe('60.00');
  });

  it('usa el rango UTC del mes solicitado', async () => {
    accounts.findByUserId.mockResolvedValue([]);
    transactions.sumByUserIdAndTypes.mockResolvedValue(new Decimal(0));
    transactions.findByUserId.mockResolvedValue({ items: [], total: 0 });
    loans.findByUserIdAndStatusIn.mockResolvedValue([]);

    const summary = await service.getSummary(user, '2026-02');

    expect(summary.month).toBe('2026-02');
    expect(transactions.sumByUserIdAndTypes).toHaveBeenCalledWith(
      'user-1',
      ['INGRESO'],
      new Date(Date.UTC(2026, 1, 1)),
      new Date(Date.UTC(2026, 2, 1)),
    );
  });

  it('rechaza un mes con formato inválido', async () => {
    await expect(service.getSummary(user, '2026-13')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('devuelve ceros cuando no hay datos', async () => {
    accounts.findByUserId.mockResolvedValue([]);
    transactions.sumByUserIdAndTypes.mockResolvedValue(new Decimal(0));
    transactions.findByUserId.mockResolvedValue({ items: [], total: 0 });
    loans.findByUserIdAndStatusIn.mockResolvedValue([]);

    const summary = await service.getSummary(user, '2026-01');

    expect(summary.totalBalance.toFixed(2)).toBe('0.00');
    expect(summary.pendingLoansTotal.toFixed(2)).toBe('0.00');
  });
});
