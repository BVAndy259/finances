'use client';

import { Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { AccountForm } from '@/components/accounts/account-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '@/lib/queries/use-accounts';
import type { Account, AccountInput } from '@/lib/types';

export default function AccountsPage() {
  const { data: accounts, isLoading, isError, error, refetch } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (createAccount.isPending || updateAccount.isPending) {
      return;
    }
    setFormOpen(false);
  };

  const submitForm = async (input: AccountInput) => {
    if (editing?.id) {
      await updateAccount.mutateAsync({ id: editing.id, input });
    } else {
      await createAccount.mutateAsync(input);
    }
    setFormOpen(false);
  };

  const requestDelete = (account: Account) => {
    setDeleteError(null);
    setDeleting(account);
  };

  const confirmDelete = async () => {
    if (!deleting?.id) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteAccount.mutateAsync(deleting.id);
      setDeleting(null);
    } catch (deleteFailure) {
      setDeleteError(getErrorMessage(deleteFailure));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !accounts) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-6">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          No se pudieron cargar las cuentas
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

  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.balance),
    0,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cuentas</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saldo total: {formatCurrency(totalBalance)}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </header>

      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 dark:border-slate-700 dark:bg-slate-900 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            <Wallet className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Aún no tienes cuentas
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Crea tu primera cuenta para empezar a registrar movimientos.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Crear cuenta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <article
              key={account.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <Wallet className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {account.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {account.currency} · creada el{' '}
                      {formatDate(account.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {account.currency}
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(account.balance, account.currency)}
              </p>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button
                  variant="ghost"
                  className="px-2"
                  onClick={() => openEdit(account)}
                  aria-label={`Editar ${account.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  onClick={() => requestDelete(account)}
                  aria-label={`Eliminar ${account.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
        onClose={closeForm}
      >
        <AccountForm
          key={editing?.id ?? 'create'}
          initial={editing}
          submitLabel={editing ? 'Guardar cambios' : 'Crear cuenta'}
          onSubmit={submitForm}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Eliminar cuenta"
        onClose={() => setDeleting(null)}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Seguro que quieres eliminar{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{deleting?.name}</span>?
          Esta acción no se puede deshacer.
        </p>

        {deleteError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {deleteError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setDeleting(null)}
            disabled={deleteAccount.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => void confirmDelete()}
            disabled={deleteAccount.isPending}
          >
            {deleteAccount.isPending && (
              <Spinner className="h-4 w-4 text-white" />
            )}
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
