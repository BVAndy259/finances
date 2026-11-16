import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api-client';
import type { Loan, LoanInput, LoanPaymentInput } from '../types';

export function useLoans(status?: string) {
  return useQuery({
    queryKey: ['loans', status ?? 'all'],
    queryFn: () =>
      apiFetch<Loan[]>(status ? `/loans?status=${status}` : '/loans'),
  });
}

function useInvalidateLoans() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['loans'] }),
      queryClient.invalidateQueries({ queryKey: ['accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
    ]);
  };
}

export function useCreateLoan() {
  const invalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: (input: LoanInput) =>
      apiFetch<Loan>('/loans', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useRegisterLoanPayment() {
  const invalidate = useInvalidateLoans();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LoanPaymentInput }) =>
      apiFetch<Loan>(`/loans/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}
