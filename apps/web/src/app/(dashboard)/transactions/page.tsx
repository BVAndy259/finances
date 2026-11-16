'use client';

import { TRANSACTION_TYPES } from '@expense-tracker/shared';
import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MovementForm } from '@/components/transactions/movement-form';
import { TransferForm } from '@/components/transactions/transfer-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { getErrorMessage } from '@/lib/api-client';
import {
  formatCurrency,
  formatDate,
  transactionLabel,
} from '@/lib/format';
import { useAccounts } from '@/lib/queries/use-accounts';
import {
  useCreateExpense,
  useCreateIncome,
  useCreateTransfer,
  useTransactions,
} from '@/lib/queries/use-transactions';
import type {
  MoneyMovementInput,
  TransactionFilters,
  TransferInput,
} from '@/lib/types';

const PAGE_SIZE = 10;

const INCOME_TYPES = new Set([
  'INGRESO',
  'INGRESO_COBRO',
  'TRANSFERENCIA_ENTRADA',
]);

type FormKind = 'expense' | 'income' | 'transfer' | null;

const FORM_TITLES: Record<Exclude<FormKind, null>, string> = {
  expense: 'Registrar gasto',
  income: 'Registrar ingreso',
  transfer: 'Transferir entre cuentas',
};

export default function TransactionsPage() {
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [formKind, setFormKind] = useState<FormKind>(null);

  const filters = useMemo<TransactionFilters>(
    () => ({
      accountId: accountId || undefined,
      type: type || undefined,
      from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [accountId, type, from, to, page],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useTransactions(filters);
  const { data: accounts } = useAccounts();
  const accountsList = useMemo(() => accounts ?? [], [accounts]);

  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  const createTransfer = useCreateTransfer();

  const accountNames = useMemo(
    () =>
      new Map(
        accountsList
          .filter((account) => account.id)
          .map((account) => [account.id as string, account.name]),
      ),
    [accountsList],
  );

  const accountCurrencies = useMemo(
    () =>
      new Map(
        accountsList
          .filter((account) => account.id)
          .map((account) => [account.id as string, account.currency]),
      ),
    [accountsList],
  );

  const isSaving =
    createExpense.isPending ||
    createIncome.isPending ||
    createTransfer.isPending;

  const resetFilters = () => {
    setAccountId('');
    setType('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const closeForm = () => {
    if (!isSaving) {
      setFormKind(null);
    }
  };

  const submitMovement = async (input: MoneyMovementInput) => {
    if (formKind === 'expense') {
      await createExpense.mutateAsync(input);
    } else {
      await createIncome.mutateAsync(input);
    }
    setFormKind(null);
  };

  const submitTransfer = async (input: TransferInput) => {
    await createTransfer.mutateAsync(input);
    setFormKind(null);
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Transacciones
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Historial de gastos, ingresos y transferencias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFormKind('expense')}
            disabled={accountsList.length === 0}
          >
            <TrendingDown className="h-4 w-4" />
            Gasto
          </Button>
          <Button
            variant="secondary"
            onClick={() => setFormKind('income')}
            disabled={accountsList.length === 0}
          >
            <TrendingUp className="h-4 w-4" />
            Ingreso
          </Button>
          <Button
            variant="secondary"
            onClick={() => setFormKind('transfer')}
            disabled={accountsList.length < 2}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Transferir
          </Button>
        </div>
      </header>

      {accountsList.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Necesitas al menos una cuenta para registrar movimientos.{' '}
          <Link href="/accounts" className="font-medium underline">
            Crea una cuenta
          </Link>
          .
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="filter-account"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Cuenta
            </label>
            <Select
              id="filter-account"
              value={accountId}
              onChange={(event) => {
                setAccountId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las cuentas</option>
              {accountsList.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label
              htmlFor="filter-type"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Tipo
            </label>
            <Select
              id="filter-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los tipos</option>
              {TRANSACTION_TYPES.map((transactionType) => (
                <option key={transactionType} value={transactionType}>
                  {transactionLabel(transactionType)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label
              htmlFor="filter-from"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Desde
            </label>
            <Input
              id="filter-from"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label
              htmlFor="filter-to"
              className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              Hasta
            </label>
            <Input
              id="filter-to"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={resetFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : isError || !data ? (
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              No se pudieron cargar las transacciones
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {getErrorMessage(error)}
            </p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : data.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No hay transacciones para los filtros seleccionados.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.items.map((transaction) => {
                const positive = INCOME_TYPES.has(
                  transaction.transactionType,
                );

                return (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {transaction.description}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {transactionLabel(transaction.transactionType)} ·{' '}
                        {accountNames.get(transaction.accountId) ?? 'Cuenta'} ·{' '}
                        {formatDate(transaction.transactionDate)}
                        {transaction.location
                          ? ` · ${transaction.location}`
                          : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {positive ? '+' : '-'}
                      {formatCurrency(
                        transaction.amount,
                        accountCurrencies.get(transaction.accountId) ?? 'PEN',
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {total} {total === 1 ? 'movimiento' : 'movimientos'} · página{' '}
                {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        open={formKind !== null}
        title={formKind ? FORM_TITLES[formKind] : ''}
        onClose={closeForm}
      >
        {formKind === 'transfer' ? (
          <TransferForm
            accounts={accountsList}
            onSubmit={submitTransfer}
            onCancel={closeForm}
          />
        ) : formKind ? (
          <MovementForm
            key={formKind}
            kind={formKind}
            accounts={accountsList}
            onSubmit={submitMovement}
            onCancel={closeForm}
          />
        ) : null}
      </Modal>
    </div>
  );
}
