'use client';

import { useLayoutEffect } from 'react';
import { applyTheme, getPreferredTheme, getStoredTheme } from '@/lib/theme';

export function ThemeSync() {
  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const sync = () => {
      applyTheme(getStoredTheme() ?? getPreferredTheme());
    };

    sync();

    const onChange = () => {
      if (!getStoredTheme()) {
        applyTheme(media.matches ? 'dark' : 'light');
      }
    };

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return null;
}
