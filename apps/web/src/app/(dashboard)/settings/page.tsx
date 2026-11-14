'use client';

import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/format';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Ajustes</h1>
      <p className="mt-2 text-sm text-slate-500">
        Información de tu cuenta.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Alias
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{user?.alias}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Miembro desde
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {user?.createdAt ? formatDate(user.createdAt) : '-'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
