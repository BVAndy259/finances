'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-client';
import type { Account, LoanInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const loanSchema = z.object({
  accountId: z.string().min(1, 'Selecciona una cuenta'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)')
    .refine((value) => Number(value) > 0, 'El monto debe ser mayor a cero'),
  debtorName: z
    .string()
    .min(1, 'Ingresa el nombre del deudor')
    .max(255, 'El nombre es demasiado largo'),
  description: z
    .string()
    .min(1, 'Ingresa el motivo del préstamo')
    .max(255, 'La descripción es demasiado larga'),
  dueDate: z
    .string()
    .refine(
      (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
      'Fecha inválida',
    )
    .optional(),
});

type LoanValues = z.infer<typeof loanSchema>;

interface LoanFormProps {
  accounts: Account[];
  onSubmit: (input: LoanInput) => Promise<void>;
  onCancel: () => void;
}

export function LoanForm({ accounts, onSubmit, onCancel }: LoanFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoanValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      accountId: accounts[0]?.id ?? '',
      amount: '',
      debtorName: '',
      description: '',
      dueDate: '',
    },
  });

  const submit = async (values: LoanValues) => {
    setServerError(null);

    try {
      await onSubmit({
        accountId: values.accountId,
        amount: values.amount,
        debtorName: values.debtorName.trim(),
        description: values.description.trim(),
        dueDate: values.dueDate || undefined,
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <div>
        <label
          htmlFor="loan-account"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Cuenta de origen
        </label>
        <Select id="loan-account" {...register('accountId')}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </Select>
        {errors.accountId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.accountId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="loan-amount"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Monto
        </label>
        <Input
          id="loan-amount"
          inputMode="decimal"
          placeholder="0.00"
          {...register('amount')}
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="loan-debtor"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Deudor
        </label>
        <Input
          id="loan-debtor"
          placeholder="Ej: Juan"
          {...register('debtorName')}
        />
        {errors.debtorName && (
          <p className="mt-1 text-xs text-red-600">
            {errors.debtorName.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="loan-description"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Motivo
        </label>
        <Input
          id="loan-description"
          placeholder="Ej: Para el taxi"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="loan-due-date"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Fecha límite <span className="text-slate-400">(opcional)</span>
        </label>
        <Input id="loan-due-date" type="date" {...register('dueDate')} />
        {errors.dueDate && (
          <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
          Registrar préstamo
        </Button>
      </div>
    </form>
  );
}
