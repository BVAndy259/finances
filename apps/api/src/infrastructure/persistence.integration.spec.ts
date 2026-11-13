import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import Decimal from 'decimal.js';
import { DataType, newDb } from 'pg-mem';
import { DataSource, EntityManager } from 'typeorm';
import {
  AccountMapper,
  AccountRepositoryAdapter,
  AppUserMapper,
  AppUserRepositoryAdapter,
  LoanMapper,
  LoanRepositoryAdapter,
  TransactionMapper,
  TransactionRepositoryAdapter,
  TypeOrmContext,
  TypeOrmUnitOfWork,
  typeOrmEntities,
} from '@expense-tracker/database';
import { AccountService } from '../application/usecase/account.service';
import { AppUserService } from '../application/usecase/app-user.service';
import { LoanService } from '../application/usecase/loan.service';
import { TransactionService } from '../application/usecase/transaction.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SCHEMA = `
  CREATE TABLE "app_user" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "telegram_chat_id" varchar UNIQUE,
    "email" varchar UNIQUE,
    "password_hash" varchar,
    "refresh_token_hash" varchar(64),
    "alias" varchar,
    "created_at" timestamp DEFAULT now()
  );
  CREATE TABLE "account" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES "app_user"("id"),
    "name" varchar,
    "balance" numeric(12,2),
    "currency" varchar DEFAULT 'PEN',
    "created_at" timestamp DEFAULT now()
  );
  CREATE TABLE "transaction" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid REFERENCES "account"("id"),
    "transaction_type" varchar,
    "amount" numeric(12,2),
    "description" varchar,
    "location" varchar,
    "transaction_date" timestamp DEFAULT now()
  );
  CREATE TABLE "loan" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES "app_user"("id"),
    "account_id" uuid REFERENCES "account"("id"),
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
    db.public.registerFunction({
      name: 'gen_random_uuid',
      returns: DataType.uuid,
      impure: true,
      implementation: () => randomUUID(),
    });
    db.public.none(SCHEMA);

    dataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: typeOrmEntities,
      synchronize: false,
      uuidExtension: 'pgcrypto',
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
    accountService = new AccountService(
      accountRepository,
      transactionRepository,
      loanRepository,
    );
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
    expect(user.id).toMatch(UUID_PATTERN);
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

    expect(loan.id).toMatch(UUID_PATTERN);

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

    const allLoans = await loanService.listLoans(user);
    expect(allLoans).toHaveLength(1);

    const fetchedLoan = await loanService.getLoanForUser(user, loan.id!);
    expect(fetchedLoan.debtorName).toBe('Juan');

    const listed = await transactionService.listTransactions(user, {
      page: 1,
      limit: 10,
    });
    expect(listed.total).toBeGreaterThan(0);
    expect(listed.items).toHaveLength(listed.total);

    const fetched = await transactionService.getTransactionForUser(
      user,
      listed.items[0].id!,
    );
    expect(fetched.id).toBe(listed.items[0].id);
  });
});
