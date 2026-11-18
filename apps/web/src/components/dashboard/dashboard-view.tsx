'use client';

import {
  HandCoins,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getErrorMessage } from '@/lib/api-client';
import {
  formatCurrency,
  formatDate,
  formatMonth,
  loanStatusLabel,
  transactionLabel,
} from '@/lib/format';
import { useDashboardSummary } from '@/lib/queries/use-dashboard-summary';
import { Button } from '@/components/ui/button';

const INCOME_TYPES = new Set([
  'INGRESO',
  'INGRESO_COBRO',
  'TRANSFERENCIA_ENTRADA',
]);

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  valueClassName?: string;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClassName = 'text-slate-900 dark:text-slate-100',
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 text-2xl font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboardSummary();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-6">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          No se pudo cargar el resumen
        </h2>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{getErrorMessage(error)}</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => void refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  const netNumber = Number(data.net);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hola, {user?.alias}</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Resumen de {formatMonth(data.month)}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => void refetch()}>
          Actualizar
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Saldo total"
          value={formatCurrency(data.totalBalance)}
          icon={Wallet}
        />
        <SummaryCard
          label="Ingresos del mes"
          value={formatCurrency(data.income)}
          icon={TrendingUp}
          valueClassName="text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          label="Egresos del mes"
          value={formatCurrency(data.expense)}
          icon={TrendingDown}
          valueClassName="text-red-600 dark:text-red-400"
        />
        <SummaryCard
          label="Balance del mes"
          value={formatCurrency(data.net)}
          icon={Scale}
          valueClassName={netNumber >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
        <SummaryCard
          label="Por cobrar"
          value={formatCurrency(data.loans.total)}
          icon={HandCoins}
          valueClassName="text-amber-600 dark:text-amber-400"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Últimas transacciones
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {data.recentTransactions.length} recientes
            </span>
          </div>

          {data.recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aún no tienes transacciones registradas.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentTransactions.map((transaction) => {
                const positive = INCOME_TYPES.has(transaction.transactionType);

                return (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {transactionLabel(transaction.transactionType)} ·{' '}
                        {formatDate(transaction.transactionDate)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {positive ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Cuentas
            </h2>

            {data.accounts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No tienes cuentas aún.</p>
            ) : (
              <ul className="space-y-3">
                {data.accounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {account.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(account.balance, account.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Préstamos pendientes
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {data.loans.count} activos
              </span>
            </div>

            {data.loans.items.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No tienes préstamos pendientes.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.loans.items.map((loan) => (
                  <li
                    key={loan.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {loan.debtorName}
                      </p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                        {loan.description?.trim()
                          ? `Motivo: ${loan.description}`
                          : 'Sin motivo'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {loanStatusLabel(loan.status)}
                        {loan.dueDate ? ` · vence ${loan.dueDate}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(loan.remainingAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">Datos actualizados desde la API.</p>
    </div>
  );
}
