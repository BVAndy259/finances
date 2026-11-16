import type { ReactNode } from 'react';
import { DashboardGuard } from '@/components/layout/dashboard-guard';

export const instant = false;

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardGuard>{children}</DashboardGuard>;
}
