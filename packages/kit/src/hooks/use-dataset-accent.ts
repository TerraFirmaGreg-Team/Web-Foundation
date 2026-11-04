'use client';
import { useLayoutEffect } from 'react';

export function useDatasetAccent(accent?: string) {
  useLayoutEffect(() => {
    if (!accent) return;
    const root = document.documentElement;
    root.style.setProperty('--color-link-accent', accent);
    return () => {
      root.style.removeProperty('--color-link-accent');
    };
  }, [accent]);
}

