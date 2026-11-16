'use client';

import {
  ChangeEmailForm,
  ChangePasswordForm,
} from '@/components/settings/credentials-forms';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/format';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Ajustes</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Información de tu cuenta.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Alias
            </dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{user?.alias}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Email
            </dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Telegram
            </dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {user?.telegramChatId ? 'Vinculado' : 'No vinculado'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Miembro desde
            </dt>
            <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
              {user?.createdAt ? formatDate(user.createdAt) : '-'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 space-y-4">
        <ChangeEmailForm />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
