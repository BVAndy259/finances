'use client';

import { LOAN_STATUSES } from '@expense-tracker/shared';
import { HandCoins, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LoanForm } from '@/components/loans/loan-form';
import { LoanPaymentForm } from '@/components/loans/loan-payment-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { getErrorMessage } from '@/lib/api-client';
import {
  formatCurrency,
  formatDate,
  formatDateOnly,
  loanStatusLabel,
} from '@/lib/format';
import { useAccounts } from '@/lib/queries/use-accounts';
import {
  useCreateLoan,
  useLoans,
  useRegisterLoanPayment,
} from '@/lib/queries/use-loans';
import type { Loan, LoanInput, LoanPaymentInput } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  PAGO_PARCIAL: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  PAGADO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
};

export default function LoansPage() {
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);

  const { data: loans, isLoading, isError, error, refetch } = useLoans(
    status || undefined,
  );
  const { data: accounts } = useAccounts();
  const accountsList = useMemo(() => accounts ?? [], [accounts]);

  const createLoan = useCreateLoan();
  const registerPayment = useRegisterLoanPayment();

  const accountNames = useMemo(
    () =>
      new Map(
        accountsList
          .filter((account) => account.id)
          .map((account) => [account.id as string, account.name]),
      ),
    [accountsList],
  );

  const isSaving = createLoan.isPending || registerPayment.isPending;

  const closeCreate = () => {
    if (!isSaving) {
      setCreateOpen(false);
    }
  };

  const closePayment = () => {
    if (!isSaving) {
      setPayingLoan(null);
    }
  };

  const submitLoan = async (input: LoanInput) => {
    await createLoan.mutateAsync(input);
    setCreateOpen(false);
  };

  const submitPayment = async (input: LoanPaymentInput) => {
    if (!payingLoan?.id) {
      return;
    }

    await registerPayment.mutateAsync({ id: payingLoan.id, input });
    setPayingLoan(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !loans) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-6">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          No se pudieron cargar los préstamos
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

  const pendingTotal = loans
    .filter((loan) => loan.status !== 'PAGADO')
    .reduce((total, loan) => total + Number(loan.remainingAmount), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loans.length} {loans.length === 1 ? 'préstamo' : 'préstamos'}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Préstamos</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Por cobrar en esta vista: {formatCurrency(pendingTotal)}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={accountsList.length === 0}
        >
          <Plus className="h-4 w-4" />
          Nuevo préstamo
        </Button>
      </header>

      {accountsList.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Necesitas al menos una cuenta para registrar préstamos.{' '}
          <Link href="/accounts" className="font-medium underline">
            Crea una cuenta
          </Link>
          .
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm">
        <div className="max-w-xs">
          <label
            htmlFor="filter-loan-status"
            className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Estado
          </label>
          <Select
            id="filter-loan-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Todos los estados</option>
            {LOAN_STATUSES.map((loanStatus) => (
              <option key={loanStatus} value={loanStatus}>
                {loanStatusLabel(loanStatus)}
              </option>
            ))}
          </Select>
        </div>
      </section>

      {loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 dark:border-slate-700 dark:bg-slate-900 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <HandCoins className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            No hay préstamos para este filtro
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Registra un préstamo o cambia el estado seleccionado.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loans.map((loan) => {
            const paid = loan.status === 'PAGADO';

            return (
              <article
                key={loan.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      <HandCoins className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {loan.debtorName}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {accountNames.get(loan.accountId) ?? 'Cuenta'} ·{' '}
                        {formatDate(loan.loanDate)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      STATUS_STYLES[loan.status] ??
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {loanStatusLabel(loan.status)}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Prestado
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(loan.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Abonado
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(loan.paidAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Pendiente
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {formatCurrency(loan.remainingAmount)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {loan.dueDate
                    ? `Vence el ${formatDateOnly(loan.dueDate)}`
                    : 'Sin fecha límite'}
                </p>

                <div className="mt-4 flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Button
                    variant="secondary"
                    disabled={paid || accountsList.length === 0}
                    onClick={() => setPayingLoan(loan)}
                  >
                    {paid ? 'Pagado' : 'Registrar abono'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        title="Nuevo préstamo"
        onClose={closeCreate}
      >
        <LoanForm
          accounts={accountsList}
          onSubmit={submitLoan}
          onCancel={closeCreate}
        />
      </Modal>

      <Modal
        open={Boolean(payingLoan)}
        title="Registrar abono"
        onClose={closePayment}
      >
        {payingLoan && (
          <LoanPaymentForm
            key={payingLoan.id}
            loan={payingLoan}
            accounts={accountsList}
            onSubmit={submitPayment}
            onCancel={closePayment}
          />
        )}
      </Modal>
    </div>
  );
}
