// src/components/ThemeListener.tsx
'use client';

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { themeStore } from '@/components/bolt/lib/stores/theme';

export function ThemeListener() {
  const theme = useStore(themeStore);

  useEffect(() => {
    // This runs after the app hydrates
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null; // No visible UI, it just sets the theme
}
