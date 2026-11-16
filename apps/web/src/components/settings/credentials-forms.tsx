'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getErrorMessage } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const emailSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  email: z.string().email('Ingresa un email válido'),
});

type EmailValues = z.infer<typeof emailSchema>;

export function ChangeEmailForm() {
  const { updateCredentials } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { currentPassword: '', email: '' },
  });

  const submit = async (values: EmailValues) => {
    setServerError(null);
    setSuccess(null);

    try {
      await updateCredentials({
        currentPassword: values.currentPassword,
        email: values.email,
      });
      setSuccess('Email actualizado correctamente.');
      reset();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Cambiar email
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Necesitas tu contraseña actual para confirmar el cambio.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <div>
          <label
            htmlFor="email-current-password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Contraseña actual
          </label>
          <Input
            id="email-current-password"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email-new"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Nuevo email
          </label>
          <Input
            id="email-new"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="h-4 w-4 text-white" />}
          Actualizar email
        </Button>
      </form>
    </section>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function ChangePasswordForm() {
  const { updateCredentials } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const submit = async (values: PasswordValues) => {
    setServerError(null);
    setSuccess(null);

    try {
      await updateCredentials({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setSuccess('Contraseña actualizada correctamente.');
      reset();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Cambiar contraseña
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Necesitas tu contraseña actual para confirmar el cambio.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        <div>
          <label
            htmlFor="password-current"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Contraseña actual
          </label>
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password-new"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Nueva contraseña
          </label>
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password-confirm"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Confirmar nueva contraseña
          </label>
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="h-4 w-4 text-white" />}
          Actualizar contraseña
        </Button>
      </form>
    </section>
  );
}
