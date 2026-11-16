'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-client';
import type { Account, MoneyMovementInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const movementSchema = z.object({
  accountId: z.string().min(1, 'Selecciona una cuenta'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)')
    .refine((value) => Number(value) > 0, 'El monto debe ser mayor a cero'),
  description: z
    .string()
    .min(1, 'Ingresa una descripción')
    .max(255, 'La descripción es demasiado larga'),
  location: z.string().max(255, 'La ubicación es demasiado larga').optional(),
});

type MovementValues = z.infer<typeof movementSchema>;

interface MovementFormProps {
  kind: 'expense' | 'income';
  accounts: Account[];
  onSubmit: (input: MoneyMovementInput) => Promise<void>;
  onCancel: () => void;
}

export function MovementForm({
  kind,
  accounts,
  onSubmit,
  onCancel,
}: MovementFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isExpense = kind === 'expense';
  const title = isExpense ? 'gasto' : 'ingreso';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MovementValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      accountId: accounts[0]?.id ?? '',
      amount: '',
      description: '',
      location: 'Web',
    },
  });

  const submit = async (values: MovementValues) => {
    setServerError(null);

    try {
      await onSubmit({
        accountId: values.accountId,
        amount: values.amount,
        description: values.description.trim(),
        location: values.location?.trim() || undefined,
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <div>
        <label
          htmlFor={`${kind}-account`}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Cuenta
        </label>
        <Select id={`${kind}-account`} {...register('accountId')}>
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
          htmlFor={`${kind}-amount`}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Monto
        </label>
        <Input
          id={`${kind}-amount`}
          inputMode="decimal"
          placeholder="0.00"
          {...register('amount')}
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${kind}-description`}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Descripción
        </label>
        <Input
          id={`${kind}-description`}
          placeholder={isExpense ? 'Ej: Almuerzo' : 'Ej: Sueldo'}
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${kind}-location`}
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Ubicación <span className="text-slate-400 dark:text-slate-500">(opcional)</span>
        </label>
        <Input
          id={`${kind}-location`}
          placeholder="Ej: Web"
          {...register('location')}
        />
        {errors.location && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.location.message}
          </p>
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
          Registrar {title}
        </Button>
      </div>
    </form>
  );
}
