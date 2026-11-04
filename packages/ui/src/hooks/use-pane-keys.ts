'use client';

import { useEffect } from 'react';

export function usePaneKeys<T extends string>(
  picks: Partial<Record<'r' | 'u' | 't', T>>,
  onSelect: (id: T) => void,
) {
  const { r, u, t } = picks;
  useEffect(() => {
    const map = { r, u, t };
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        )
      ) {
        return;
      }
      const id = map[event.key.toLowerCase() as 'r' | 'u' | 't'];
      if (id) onSelect(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [r, u, t, onSelect]);
}

