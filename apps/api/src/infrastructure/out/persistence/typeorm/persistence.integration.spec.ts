import { AsyncLocalStorage } from 'node:async_hooks';
import Decimal from 'decimal.js';
import { DataType, newDb } from 'pg-mem';
import { DataSource, EntityManager } from 'typeorm';
import { AccountService } from '../../../../application/usecase/account.service';
import { AppUserService } from '../../../../application/usecase/app-user.service';
import { LoanService } from '../../../../application/usecase/loan.service';
import { TransactionService } from '../../../../application/usecase/transaction.service';
import { AccountRepositoryAdapter } from './adapters/account.repository.adapter';
import { AppUserRepositoryAdapter } from './adapters/app-user.repository.adapter';
import { LoanRepositoryAdapter } from './adapters/loan.repository.adapter';
import { TransactionRepositoryAdapter } from './adapters/transaction.repository.adapter';
import { typeOrmEntities } from './entities';
import { AccountMapper } from './mappers/account.mapper';
import { AppUserMapper } from './mappers/app-user.mapper';
import { LoanMapper } from './mappers/loan.mapper';
import { TransactionMapper } from './mappers/transaction.mapper';
import { TypeOrmContext } from './typeorm-context';
import { TypeOrmUnitOfWork } from './unit-of-work.adapter';

const SCHEMA = `
  CREATE TABLE "app_user" (
    "id" SERIAL PRIMARY KEY,
    "telegram_chat_id" varchar UNIQUE,
    "alias" varchar,
    "created_at" timestamp DEFAULT now()
  );
  CREATE TABLE "account" (
    "id" SERIAL PRIMARY KEY,
    "user_id" integer REFERENCES "app_user"("id"),
    "name" varchar,
    "balance" numeric(12,2),
    "currency" varchar DEFAULT 'PEN',
    "created_at" timestamp DEFAULT now()
  );
  CREATE TABLE "transaction" (
    "id" SERIAL PRIMARY KEY,
    "account_id" integer REFERENCES "account"("id"),
    "transaction_type" varchar,
    "amount" numeric(12,2),
    "description" varchar,
    "location" varchar,
    "transaction_date" timestamp DEFAULT now()
  );
  CREATE TABLE "loan" (
    "id" SERIAL PRIMARY KEY,
    "user_id" integer REFERENCES "app_user"("id"),
    "account_id" integer REFERENCES "account"("id"),
    "debtor_name" varchar,
    "amount" numeric(12,2),
    "paid_amount" numeric(12,2) NOT NULL DEFAULT 0,
    "due_date" date,
    "status" varchar NOT NULL DEFAULT 'PENDIENTE',
    "created_at" timestamp DEFAULT now()
  );
`;

describe('TypeORM persistence integration', () => {
  let dataSource: DataSource;
  let appUserService: AppUserService;
  let accountService: AccountService;
  let transactionService: TransactionService;
  let loanService: LoanService;

  beforeEach(async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'PostgreSQL 14.0',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'test',
    });
    db.public.none(SCHEMA);

    dataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: typeOrmEntities,
      synchronize: false,
    });
    await dataSource.initialize();

    const storage = new AsyncLocalStorage<EntityManager>();
    const context = new TypeOrmContext(dataSource, storage);
    const unitOfWork = new TypeOrmUnitOfWork(dataSource, storage);

    const appUserRepository = new AppUserRepositoryAdapter(
      context,
      new AppUserMapper(),
    );
    const accountRepository = new AccountRepositoryAdapter(
      context,
      new AccountMapper(),
    );
    const transactionRepository = new TransactionRepositoryAdapter(
      context,
      new TransactionMapper(),
    );
    const loanRepository = new LoanRepositoryAdapter(context, new LoanMapper());

    appUserService = new AppUserService(appUserRepository);
    accountService = new AccountService(accountRepository);
    transactionService = new TransactionService(
      transactionRepository,
      accountRepository,
      unitOfWork,
    );
    loanService = new LoanService(
      loanRepository,
      accountRepository,
      transactionRepository,
      unitOfWork,
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('ejecuta el flujo completo de usuario, cuentas, transacciones y préstamos', async () => {
    const user = await appUserService.registerUserIfNotExists(
      '123456',
      'Kratos',
    );
    const again = await appUserService.registerUserIfNotExists(
      '123456',
      'Otro alias',
    );
    expect(again.id).toBe(user.id);

    const yape = await accountService.createAccount(user, 'Yape');
    await accountService.createAccount(user, 'BCP');

    await transactionService.registerIncome(
      yape,
      new Decimal('100.00'),
      'Sueldo',
      'Bot',
    );

    let accounts = await accountService.getAccountsByUser(user);
    expect(accounts.find((a) => a.name === 'Yape')?.balance.toFixed(2)).toBe(
      '100.00',
    );

    const yapeAfterIncome = accounts.find((a) => a.name === 'Yape')!;
    await transactionService.registerExpense(
      yapeAfterIncome,
      new Decimal('25.00'),
      'Almuerzo',
      'Bot',
    );

    const loan = await loanService.grantLoan(
      yapeAfterIncome,
      new Decimal('20.00'),
      'Juan',
      'Taxi',
      null,
    );

    expect(loan.id).toBeDefined();

    const paidLoan = await loanService.payLoan(
      loan.id!,
      yapeAfterIncome,
      new Decimal('10.00'),
    );

    expect(paidLoan.status).toBe('PAGO_PARCIAL');
    expect(paidLoan.remainingAmount.toFixed(2)).toBe('10.00');

    accounts = await accountService.getAccountsByUser(user);
    const yapeAfterLoan = accounts.find((a) => a.name === 'Yape')!;
    expect(yapeAfterLoan.balance.toFixed(2)).toBe('65.00');

    const bcpAccount = accounts.find((a) => a.name === 'BCP')!;
    await transactionService.transfer(
      yapeAfterLoan,
      bcpAccount,
      new Decimal('15.00'),
      'Ahorro',
      'Bot',
    );

    accounts = await accountService.getAccountsByUser(user);
    expect(accounts.find((a) => a.name === 'Yape')?.balance.toFixed(2)).toBe(
      '50.00',
    );
    expect(accounts.find((a) => a.name === 'BCP')?.balance.toFixed(2)).toBe(
      '15.00',
    );

    const total = await accountService.getTotalBalance(user);
    expect(total.toFixed(2)).toBe('65.00');

    const pending = await loanService.getPendingLoans(user);
    expect(pending).toHaveLength(1);
    expect(pending[0].debtorName).toBe('Juan');
  });
});
