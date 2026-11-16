'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-client';
import type { Account, AccountInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const accountSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'El nombre es demasiado largo'),
  currency: z
    .string()
    .regex(/^[A-Za-z]{3}$/, 'Usa un código de 3 letras (Ej: PEN)'),
});

type AccountValues = z.infer<typeof accountSchema>;

interface AccountFormProps {
  initial?: Account | null;
  submitLabel: string;
  onSubmit: (input: AccountInput) => Promise<void>;
  onCancel: () => void;
}

export function AccountForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: initial?.name ?? '',
      currency: initial?.currency ?? 'PEN',
    },
  });

  const submit = async (values: AccountValues) => {
    setServerError(null);

    try {
      await onSubmit({
        name: values.name.trim(),
        currency: values.currency.trim().toUpperCase(),
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
      <div>
        <label
          htmlFor="account-name"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Nombre
        </label>
        <Input
          id="account-name"
          placeholder="Ej: Yape, BCP, Efectivo"
          autoFocus
          {...register('name')}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="account-currency"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Moneda
        </label>
        <Input
          id="account-currency"
          placeholder="PEN"
          maxLength={3}
          className="uppercase"
          {...register('currency')}
        />
        {errors.currency && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {errors.currency.message}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
