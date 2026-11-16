'use client';

import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getResolvedTheme, setTheme } from '@/lib/theme';

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    setTheme(getResolvedTheme() === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
