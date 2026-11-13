import { BadRequestException, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  AccountRepositoryPort,
  AppUser,
  Transaction,
  TransactionRepositoryPort,
  UnitOfWorkPort,
} from '@expense-tracker/core';
import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let transactionRepository: jest.Mocked<TransactionRepositoryPort>;
  let unitOfWork: UnitOfWorkPort;

  const buildAccount = (balance: string): Account => {
    const account = new Account();
    account.id = '1';
    account.userId = '1';
    account.name = 'Yape';
    account.balance = new Decimal(balance);
    return account;
  };

  const buildUser = (id = '1'): AppUser => {
    const user = new AppUser();
    user.id = id;
    return user;
  };

  beforeEach(() => {
    accountRepository = {
      save: jest
        .fn()
        .mockImplementation((account: Account) => Promise.resolve(account)),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    };
    transactionRepository = {
      save: jest
        .fn()
        .mockImplementation((transaction: Transaction) =>
          Promise.resolve({ ...transaction, id: '10' }),
        ),
      findById: jest.fn(),
      findByAccountId: jest.fn(),
      findByUserId: jest.fn(),
      existsByAccountId: jest.fn(),
      sumByUserIdAndTypes: jest.fn(),
    };
    unitOfWork = {
      run: <T>(work: () => Promise<T>) => work(),
    };

    service = new TransactionService(
      transactionRepository,
      accountRepository,
      unitOfWork,
    );
  });

  it('registra un gasto y descuenta el saldo', async () => {
    const account = buildAccount('100.00');

    const transaction = await service.registerExpense(
      account,
      new Decimal('25.50'),
      'Almuerzo',
      'Bot',
    );

    expect(account.balance.toFixed(2)).toBe('74.50');
    expect(accountRepository.save).toHaveBeenCalledWith(account);
    expect(transaction.transactionType).toBe('EGRESO');
    expect(transaction.description).toBe('Almuerzo');
  });

  it('rechaza un gasto con saldo insuficiente', async () => {
    const account = buildAccount('10.00');

    await expect(
      service.registerExpense(account, new Decimal('25.00'), 'Cena', 'Bot'),
    ).rejects.toThrow('Saldo insuficiente en la cuenta: Yape');

    expect(account.balance.toFixed(2)).toBe('10.00');
    expect(accountRepository.save).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('registra un ingreso y aumenta el saldo', async () => {
    const account = buildAccount('10.00');

    const transaction = await service.registerIncome(
      account,
      new Decimal('40.00'),
      'Sueldo',
      'Bot',
    );

    expect(account.balance.toFixed(2)).toBe('50.00');
    expect(transaction.transactionType).toBe('INGRESO');
  });

  it('transfiere saldo y genera las dos transacciones', async () => {
    const origin = buildAccount('100.00');
    const destination = buildAccount('20.00');
    destination.id = '2';
    destination.name = 'BCP';

    await service.transfer(
      origin,
      destination,
      new Decimal('30.00'),
      'Ahorro',
      'Bot',
    );

    expect(origin.balance.toFixed(2)).toBe('70.00');
    expect(destination.balance.toFixed(2)).toBe('50.00');
    expect(transactionRepository.save).toHaveBeenCalledTimes(2);
    expect(accountRepository.save).toHaveBeenCalledTimes(2);
  });

  it('rechaza una transferencia sin saldo suficiente en origen', async () => {
    const origin = buildAccount('5.00');
    const destination = buildAccount('20.00');
    destination.id = '2';

    await expect(
      service.transfer(
        origin,
        destination,
        new Decimal('30.00'),
        'Ahorro',
        'Bot',
      ),
    ).rejects.toThrow('Saldo insuficiente en la cuenta origen: Yape');

    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('registra un gasto validando la propiedad de la cuenta', async () => {
    accountRepository.findById.mockResolvedValue(buildAccount('100.00'));

    const transaction = await service.registerExpenseForUser(
      buildUser(),
      '1',
      new Decimal('25.00'),
      'Almuerzo',
      'Web',
    );

    expect(accountRepository.findById).toHaveBeenCalledWith('1');
    expect(transaction.transactionType).toBe('EGRESO');
  });

  it('rechaza montos no positivos', async () => {
    await expect(
      service.registerExpenseForUser(
        buildUser(),
        '1',
        new Decimal('0'),
        'Almuerzo',
        'Web',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza movimientos sobre cuentas de otro usuario', async () => {
    const account = buildAccount('100.00');
    account.userId = 'other-user';
    accountRepository.findById.mockResolvedValue(account);

    await expect(
      service.registerIncomeForUser(
        buildUser(),
        '1',
        new Decimal('10.00'),
        'Sueldo',
        'Web',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza transferencias entre la misma cuenta', async () => {
    await expect(
      service.transferForUser(
        buildUser(),
        '1',
        '1',
        new Decimal('10.00'),
        'Ahorro',
        'Web',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('lista transacciones con filtros y valida el rango de fechas', async () => {
    transactionRepository.findByUserId.mockResolvedValue({
      items: [],
      total: 0,
    });

    const filters = { page: 1, limit: 20 };
    const result = await service.listTransactions(buildUser(), filters);

    expect(transactionRepository.findByUserId).toHaveBeenCalledWith(
      '1',
      filters,
    );
    expect(result.total).toBe(0);

    await expect(
      service.listTransactions(buildUser(), {
        from: new Date('2026-02-01'),
        to: new Date('2026-01-01'),
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza consultar una transacción de otro usuario', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      accountId: '1',
      transactionType: 'EGRESO',
      amount: new Decimal('10.00'),
      description: 'Cena',
      location: 'Web',
      transactionDate: new Date(),
    });
    const account = buildAccount('100.00');
    account.userId = 'other-user';
    accountRepository.findById.mockResolvedValue(account);

    await expect(
      service.getTransactionForUser(buildUser(), 'tx-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
