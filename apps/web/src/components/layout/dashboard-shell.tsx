'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Handshake,
  Landmark,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutGrid },
  { href: '/accounts', label: 'Cuentas', icon: Landmark },
  { href: '/transactions', label: 'Transacciones', icon: ReceiptText },
  { href: '/loans', label: 'Préstamos', icon: Handshake },
  { href: '/settings', label: 'Ajustes', icon: SlidersHorizontal },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const COLLAPSED_KEY = 'sidebar-collapsed';

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem(COLLAPSED_KEY, prev ? '0' : '1');
      } catch {
        // ignore
      }
      return !prev;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950 md:flex">
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-slate-200 bg-white p-4 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 md:sticky md:top-0 md:flex md:h-screen md:max-h-screen',
          collapsed ? 'md:w-20 md:p-3' : 'md:w-64',
        )}
      >
        <div
          className={cn(
            'mb-8 flex shrink-0 items-center gap-3',
            collapsed ? 'flex-col px-0' : 'justify-between px-2',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
              F
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Finanzas
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gestor personal
                </p>
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex items-center gap-1',
              collapsed && 'flex-col-reverse',
            )}
          >
            <ThemeToggle className={cn(!collapsed && '-mr-1')} />
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expandir menú lateral' : 'Minimizar menú lateral'}
              title={collapsed ? 'Expandir menú' : 'Minimizar menú'}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            'mt-4 shrink-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60',
            collapsed && 'flex flex-col items-center p-2',
          )}
        >
          {collapsed ? (
            <>
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white"
                title={user?.email ?? user?.alias}
              >
                {(user?.alias ?? user?.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                className="mt-2 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.alias}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
              <Button
                variant="ghost"
                className="mt-2 w-full justify-start px-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </>
          )}
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              F
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Finanzas
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              className="px-2"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                  active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
