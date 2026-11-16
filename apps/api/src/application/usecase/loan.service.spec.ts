import Decimal from 'decimal.js';
import {
  Account,
  AccountRepositoryPort,
  Loan,
  LoanRepositoryPort,
  Transaction,
  TransactionRepositoryPort,
  UnitOfWorkPort,
} from '@expense-tracker/core';
import { LoanService } from './loan.service';

describe('LoanService', () => {
  let service: LoanService;
  let loanRepository: jest.Mocked<LoanRepositoryPort>;
  let accountRepository: jest.Mocked<AccountRepositoryPort>;
  let transactionRepository: jest.Mocked<TransactionRepositoryPort>;
  let unitOfWork: UnitOfWorkPort;

  const buildAccount = (balance: string): Account => {
    const account = new Account();
    account.id = 1;
    account.userId = 1;
    account.name = 'Yape';
    account.balance = new Decimal(balance);
    return account;
  };

  const buildLoan = (
    amount: string,
    paidAmount: string,
    status: Loan['status'] = 'PENDIENTE',
  ): Loan => {
    const loan = new Loan();
    loan.id = 5;
    loan.userId = 1;
    loan.accountId = 1;
    loan.debtorName = 'Juan';
    loan.amount = new Decimal(amount);
    loan.paidAmount = new Decimal(paidAmount);
    loan.status = status;
    return loan;
  };

  beforeEach(() => {
    loanRepository = {
      save: jest.fn().mockImplementation((loan: Loan) => Promise.resolve(loan)),
      findById: jest.fn(),
      findByUserIdAndStatusIn: jest.fn(),
    };
    accountRepository = {
      save: jest
        .fn()
        .mockImplementation((account: Account) => Promise.resolve(account)),
      findById: jest.fn(),
      findByUserId: jest.fn(),
    };
    transactionRepository = {
      save: jest
        .fn()
        .mockImplementation((transaction: Transaction) =>
          Promise.resolve({ ...transaction, id: 20 }),
        ),
      findByAccountId: jest.fn(),
    };
    unitOfWork = {
      run: <T>(work: () => Promise<T>) => work(),
    };

    service = new LoanService(
      loanRepository,
      accountRepository,
      transactionRepository,
      unitOfWork,
    );
  });

  it('abona solo el monto pagado al saldo de la cuenta', async () => {
    const loan = buildLoan('100.00', '0.00');
    const account = buildAccount('0.00');
    loanRepository.findById.mockResolvedValue(loan);

    const updated = await service.payLoan(5, account, new Decimal('30.00'));

    expect(account.balance.toFixed(2)).toBe('30.00');
    expect(updated.paidAmount.toFixed(2)).toBe('30.00');
    expect(updated.status).toBe('PAGO_PARCIAL');
    expect(updated.remainingAmount.toFixed(2)).toBe('70.00');
  });

  it('marca el préstamo como PAGADO al cubrir la deuda', async () => {
    const loan = buildLoan('100.00', '70.00', 'PAGO_PARCIAL');
    const account = buildAccount('0.00');
    loanRepository.findById.mockResolvedValue(loan);

    const updated = await service.payLoan(5, account, new Decimal('30.00'));

    expect(account.balance.toFixed(2)).toBe('30.00');
    expect(updated.status).toBe('PAGADO');
    expect(updated.remainingAmount.toFixed(2)).toBe('0.00');
  });

  it('rechaza un pago mayor a la deuda', async () => {
    const loan = buildLoan('100.00', '70.00', 'PAGO_PARCIAL');
    const account = buildAccount('0.00');
    loanRepository.findById.mockResolvedValue(loan);

    await expect(
      service.payLoan(5, account, new Decimal('31.00')),
    ).rejects.toThrow('es mayor a la deuda actual');

    expect(accountRepository.save).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('rechaza cobrar un préstamo ya pagado', async () => {
    const loan = buildLoan('100.00', '100.00', 'PAGADO');
    const account = buildAccount('0.00');
    loanRepository.findById.mockResolvedValue(loan);

    await expect(
      service.payLoan(5, account, new Decimal('10.00')),
    ).rejects.toThrow('Este préstamo ya fue pagado');
  });

  it('rechaza un préstamo inexistente', async () => {
    loanRepository.findById.mockResolvedValue(null);

    await expect(
      service.payLoan(99, buildAccount('0.00'), new Decimal('10.00')),
    ).rejects.toThrow('Préstamo no encontrado');
  });
});
