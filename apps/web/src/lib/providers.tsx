'use client';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { getApiUrl } from './api-client';
import { AuthProvider } from './auth-context';
import { ThemeSync } from '@/components/theme/theme-sync';

const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

function KeepAlive() {
  useEffect(() => {
    const ping = () => {
      void fetch(`${getApiUrl()}/health`).catch(() => undefined);
    };

    ping();

    const interval = window.setInterval(ping, KEEP_ALIVE_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeSync />
        <KeepAlive />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
