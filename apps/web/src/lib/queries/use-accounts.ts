import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api-client';
import type { Account, AccountInput } from '../types';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiFetch<Account[]>('/accounts'),
  });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
    ]);
  };
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (input: AccountInput) =>
      apiFetch<Account>('/accounts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountInput }) =>
      apiFetch<Account>(`/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteAccount() {
  const invalidate = useInvalidateAccounts();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
