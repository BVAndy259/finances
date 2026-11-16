'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import type { Account, Loan, LoanPaymentInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const paymentSchema = z.object({
  accountId: z.string().min(1, 'Selecciona una cuenta'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)')
    .refine((value) => Number(value) > 0, 'El monto debe ser mayor a cero'),
});

type PaymentValues = z.infer<typeof paymentSchema>;

interface LoanPaymentFormProps {
  loan: Loan;
  accounts: Account[];
  onSubmit: (input: LoanPaymentInput) => Promise<void>;
  onCancel: () => void;
}

export function LoanPaymentForm({
  loan,
  accounts,
  onSubmit,
  onCancel,
}: LoanPaymentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      accountId: accounts[0]?.id ?? '',
      amount: '',
    },
  });

  const submit = async (values: PaymentValues) => {
    setServerError(null);

    if (Number(values.amount) > Number(loan.remainingAmount)) {
      setServerError(
        `El abono no puede superar la deuda de ${formatCurrency(
          loan.remainingAmount,
        )}`,
      );
      return;
    }

    try {
      await onSubmit({
        accountId: values.accountId,
        amount: values.amount,
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Deuda pendiente de {loan.debtorName}
        </p>
        <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(loan.remainingAmount)}
        </p>
      </div>

      <div>
        <label
          htmlFor="payment-account"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Cuenta donde recibes el abono
        </label>
        <Select id="payment-account" {...register('accountId')}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </Select>
        {errors.accountId && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.accountId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="payment-amount"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Monto del abono
        </label>
        <Input
          id="payment-amount"
          inputMode="decimal"
          placeholder="0.00"
          {...register('amount')}
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="h-4 w-4 text-white" />}
          Registrar abono
        </Button>
      </div>
    </form>
  );
}
