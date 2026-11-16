'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-client';
import type { Account, TransferInput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const transferSchema = z
  .object({
    originAccountId: z.string().min(1, 'Selecciona la cuenta origen'),
    destinationAccountId: z.string().min(1, 'Selecciona la cuenta destino'),
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido (máximo 2 decimales)')
      .refine((value) => Number(value) > 0, 'El monto debe ser mayor a cero'),
    description: z
      .string()
      .min(1, 'Ingresa una descripción')
      .max(255, 'La descripción es demasiado larga'),
    location: z.string().max(255, 'La ubicación es demasiado larga').optional(),
  })
  .refine(
    (values) => values.originAccountId !== values.destinationAccountId,
    {
      path: ['destinationAccountId'],
      message: 'La cuenta destino debe ser diferente a la origen',
    },
  );

type TransferValues = z.infer<typeof transferSchema>;

interface TransferFormProps {
  accounts: Account[];
  onSubmit: (input: TransferInput) => Promise<void>;
  onCancel: () => void;
}

export function TransferForm({
  accounts,
  onSubmit,
  onCancel,
}: TransferFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      originAccountId: accounts[0]?.id ?? '',
      destinationAccountId: accounts[1]?.id ?? '',
      amount: '',
      description: '',
      location: 'Web',
    },
  });

  const submit = async (values: TransferValues) => {
    setServerError(null);

    try {
      await onSubmit({
        originAccountId: values.originAccountId,
        destinationAccountId: values.destinationAccountId,
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
          htmlFor="transfer-origin"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Cuenta origen
        </label>
        <Select id="transfer-origin" {...register('originAccountId')}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </Select>
        {errors.originAccountId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.originAccountId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="transfer-destination"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Cuenta destino
        </label>
        <Select id="transfer-destination" {...register('destinationAccountId')}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </Select>
        {errors.destinationAccountId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.destinationAccountId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="transfer-amount"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Monto
        </label>
        <Input
          id="transfer-amount"
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
          htmlFor="transfer-description"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Descripción
        </label>
        <Input
          id="transfer-description"
          placeholder="Ej: Ahorro del mes"
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
          htmlFor="transfer-location"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Ubicación <span className="text-slate-400">(opcional)</span>
        </label>
        <Input
          id="transfer-location"
          placeholder="Ej: Web"
          {...register('location')}
        />
        {errors.location && (
          <p className="mt-1 text-xs text-red-600">
            {errors.location.message}
          </p>
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
          Transferir
        </Button>
      </div>
    </form>
  );
}
