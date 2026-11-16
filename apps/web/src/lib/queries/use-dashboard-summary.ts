import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api-client';
import type { DashboardSummary } from '../types';

export function useDashboardSummary(month?: string) {
  return useQuery({
    queryKey: ['dashboard-summary', month ?? 'current'],
    queryFn: () =>
      apiFetch<DashboardSummary>(
        month
          ? `/dashboard/summary?month=${encodeURIComponent(month)}`
          : '/dashboard/summary',
      ),
  });
}
