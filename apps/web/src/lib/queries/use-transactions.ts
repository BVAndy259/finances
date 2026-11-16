import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api-client';
import type {
  MoneyMovementInput,
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
  TransferInput,
} from '../types';

function buildQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();

  if (filters.accountId) {
    params.set('accountId', filters.accountId);
  }
  if (filters.type) {
    params.set('type', filters.type);
  }
  if (filters.from) {
    params.set('from', filters.from);
  }
  if (filters.to) {
    params.set('to', filters.to);
  }

  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));

  return params.toString();
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () =>
      apiFetch<PaginatedTransactions>(`/transactions?${buildQuery(filters)}`),
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
    ]);
  };
}

export function useCreateExpense() {
  const invalidate = useInvalidateTransactions();

  return useMutation({
    mutationFn: (input: MoneyMovementInput) =>
      apiFetch<Transaction>('/transactions/expense', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useCreateIncome() {
  const invalidate = useInvalidateTransactions();

  return useMutation({
    mutationFn: (input: MoneyMovementInput) =>
      apiFetch<Transaction>('/transactions/income', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useCreateTransfer() {
  const invalidate = useInvalidateTransactions();

  return useMutation({
    mutationFn: (input: TransferInput) =>
      apiFetch<void>('/transactions/transfer', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}
