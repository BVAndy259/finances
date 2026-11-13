import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  Account,
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  AppUser,
  BusinessRuleError,
  Loan,
  LOAN_REPOSITORY,
  LoanRepositoryPort,
  LoanStatus,
  Transaction,
  TRANSACTION_REPOSITORY,
  TransactionRepositoryPort,
  UNIT_OF_WORK,
  UnitOfWorkPort,
} from '@expense-tracker/core';

@Injectable()
export class LoanService {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepository: LoanRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
  ) {}

  grantLoan(
    originAccount: Account,
    amount: Decimal,
    debtorName: string,
    description: string,
    dueDate: string | null,
    location = 'Bot',
  ): Promise<Loan> {
    return this.unitOfWork.run(async () => {
      if (originAccount.balance.lt(amount)) {
        throw new BusinessRuleError(
          'Saldo insuficiente en la cuenta: ' + originAccount.name,
        );
      }

      originAccount.balance = originAccount.balance.sub(amount);
      await this.accountRepository.save(originAccount);

      const transaction = new Transaction();
      transaction.accountId = originAccount.id!;
      transaction.transactionType = 'EGRESO_PRESTAMO';
      transaction.amount = amount;
      transaction.description = `Préstamo a ${debtorName}: ${description}`;
      transaction.location = location;
      await this.transactionRepository.save(transaction);

      const loan = new Loan();
      loan.userId = originAccount.userId;
      loan.accountId = originAccount.id!;
      loan.debtorName = debtorName;
      loan.amount = amount;
      loan.dueDate = dueDate;
      return this.loanRepository.save(loan);
    });
  }

  payLoan(
    loanId: string,
    destinationAccount: Account,
    paymentAmount: Decimal,
    location = 'Bot',
  ): Promise<Loan> {
    return this.unitOfWork.run(async () => {
      const loan = await this.loanRepository.findById(loanId);
      if (!loan) {
        throw new BusinessRuleError('Préstamo no encontrado');
      }

      if (loan.status === 'PAGADO') {
        throw new BusinessRuleError('Este préstamo ya fue pagado');
      }

      const remaining = loan.remainingAmount;
      if (paymentAmount.gt(remaining)) {
        throw new BusinessRuleError(
          `El monto a cobrar (S/${paymentAmount.toString()}) es mayor a la deuda actual (S/${remaining.toString()})`,
        );
      }

      destinationAccount.balance =
        destinationAccount.balance.add(paymentAmount);
      await this.accountRepository.save(destinationAccount);

      const transaction = new Transaction();
      transaction.accountId = destinationAccount.id!;
      transaction.transactionType = 'INGRESO_COBRO';
      transaction.amount = paymentAmount;
      transaction.description = 'Cobro de préstamo a ' + loan.debtorName;
      transaction.location = location;
      await this.transactionRepository.save(transaction);

      loan.paidAmount = loan.paidAmount.add(paymentAmount);
      loan.status = loan.paidAmount.gte(loan.amount)
        ? 'PAGADO'
        : 'PAGO_PARCIAL';

      return this.loanRepository.save(loan);
    });
  }

  getPendingLoans(user: AppUser): Promise<Loan[]> {
    return this.loanRepository.findByUserIdAndStatusIn(user.id!, [
      'PENDIENTE',
      'PAGO_PARCIAL',
    ]);
  }

  async listLoans(user: AppUser, status?: LoanStatus): Promise<Loan[]> {
    if (status) {
      return this.loanRepository.findByUserIdAndStatusIn(user.id!, [status]);
    }

    return this.loanRepository.findByUserId(user.id!);
  }

  async getLoanForUser(user: AppUser, loanId: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(loanId);

    if (!loan || loan.userId !== user.id) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    return loan;
  }

  async grantLoanForUser(
    user: AppUser,
    accountId: string,
    amount: Decimal,
    debtorName: string,
    description: string,
    dueDate: string | null,
    location = 'Web',
  ): Promise<Loan> {
    this.assertPositiveAmount(amount);
    const account = await this.requireAccount(user.id!, accountId);

    return this.grantLoan(
      account,
      amount,
      debtorName,
      description,
      dueDate,
      location,
    );
  }

  async payLoanForUser(
    user: AppUser,
    loanId: string,
    accountId: string,
    paymentAmount: Decimal,
    location = 'Web',
  ): Promise<Loan> {
    this.assertPositiveAmount(paymentAmount);
    const loan = await this.getLoanForUser(user, loanId);
    const account = await this.requireAccount(user.id!, accountId);

    return this.payLoan(loan.id!, account, paymentAmount, location);
  }

  private async requireAccount(
    userId: string,
    accountId: string,
  ): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return account;
  }

  private assertPositiveAmount(amount: Decimal): void {
    if (amount.lte(0)) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }
  }
}
