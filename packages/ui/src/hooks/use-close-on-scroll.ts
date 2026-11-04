'use client';

import { useEffect, useRef } from 'react';

const IGNORE = '[role="menu"],[role="listbox"],[role="dialog"]';

export function useCloseOnScroll(open: boolean, close: () => void): void {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const onScroll = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(IGNORE))
        return;
      closeRef.current();
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);
}

