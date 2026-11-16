import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  AccountRepositoryPort,
  AppUser,
  LoanRepositoryPort,
  TransactionRepositoryPort,
} from '@expense-tracker/core';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let accounts: jest.Mocked<AccountRepositoryPort>;
  let transactions: jest.Mocked<TransactionRepositoryPort>;
  let loans: jest.Mocked<LoanRepositoryPort>;
  let user: AppUser;

  const buildAccount = (overrides: Partial<Account> = {}): Account => {
    const account = new Account();
    account.id = 'account-1';
    account.userId = 'user-1';
    account.name = 'Yape';
    account.balance = new Decimal('10.00');
    return Object.assign(account, overrides);
  };

  beforeEach(() => {
    user = new AppUser();
    user.id = 'user-1';
    user.alias = 'Andy';

    accounts = {
      save: jest.fn((account: Account) => Promise.resolve(account)),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    };

    transactions = {
      save: jest.fn(),
      findByAccountId: jest.fn(),
      existsByAccountId: jest.fn(),
    };

    loans = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserIdAndStatusIn: jest.fn(),
      existsByAccountId: jest.fn(),
    };

    service = new AccountService(accounts, transactions, loans);
  });

  it('crea una cuenta con saldo cero y normaliza nombre y moneda', async () => {
    const account = await service.createAccount(user, '  Yape  ', 'pen');

    expect(account.name).toBe('Yape');
    expect(account.currency).toBe('PEN');
    expect(account.balance.toFixed(2)).toBe('0.00');
    expect(account.userId).toBe('user-1');
    expect(accounts.save).toHaveBeenCalledWith(account);
  });

  it('rechaza una cuenta sin nombre', async () => {
    await expect(service.createAccount(user, '   ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('lista solo las cuentas del usuario', async () => {
    accounts.findByUserId.mockResolvedValue([buildAccount()]);

    const result = await service.getAccountsByUser(user);

    expect(accounts.findByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
  });

  it('no permite acceder a una cuenta de otro usuario', async () => {
    accounts.findById.mockResolvedValue(buildAccount({ userId: 'other-user' }));

    await expect(service.getAccountForUser(user, 'account-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('actualiza nombre y moneda de una cuenta propia', async () => {
    accounts.findById.mockResolvedValue(buildAccount());

    const updated = await service.updateAccount(user, 'account-1', {
      name: ' BCP ',
      currency: 'usd',
    });

    expect(updated.name).toBe('BCP');
    expect(updated.currency).toBe('USD');
    expect(accounts.save).toHaveBeenCalledWith(updated);
  });

  it('rechaza actualizar el nombre a vacío', async () => {
    accounts.findById.mockResolvedValue(buildAccount());

    await expect(
      service.updateAccount(user, 'account-1', { name: '  ' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('impide eliminar cuentas con transacciones', async () => {
    accounts.findById.mockResolvedValue(buildAccount());
    transactions.existsByAccountId.mockResolvedValue(true);
    loans.existsByAccountId.mockResolvedValue(false);

    await expect(service.deleteAccount(user, 'account-1')).rejects.toThrow(
      ConflictException,
    );
    expect(accounts.delete).not.toHaveBeenCalled();
  });

  it('impide eliminar cuentas con préstamos', async () => {
    accounts.findById.mockResolvedValue(buildAccount());
    transactions.existsByAccountId.mockResolvedValue(false);
    loans.existsByAccountId.mockResolvedValue(true);

    await expect(service.deleteAccount(user, 'account-1')).rejects.toThrow(
      ConflictException,
    );
    expect(accounts.delete).not.toHaveBeenCalled();
  });

  it('elimina una cuenta sin movimientos', async () => {
    accounts.findById.mockResolvedValue(buildAccount());
    transactions.existsByAccountId.mockResolvedValue(false);
    loans.existsByAccountId.mockResolvedValue(false);

    await service.deleteAccount(user, 'account-1');

    expect(accounts.delete).toHaveBeenCalledWith('account-1');
  });

  it('calcula el saldo total de las cuentas', async () => {
    accounts.findByUserId.mockResolvedValue([
      buildAccount({ balance: new Decimal('10.00') }),
      buildAccount({ id: 'account-2', balance: new Decimal('5.50') }),
    ]);

    const total = await service.getTotalBalance(user);

    expect(total.toFixed(2)).toBe('15.50');
  });
});
