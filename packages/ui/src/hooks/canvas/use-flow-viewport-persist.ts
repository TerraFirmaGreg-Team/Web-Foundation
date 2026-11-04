'use client';

import { useCallback, useEffect, useRef } from 'react';
import { VIEWPORT_SAVE_MS, writeStoredViewport } from '@terrafirmagreg-team/ui/lib/canvas/viewport';
import type { StoredViewport } from '@terrafirmagreg-team/ui/types/canvas';

export function useFlowViewportPersist(storageKey: string, resetKey: string) {
  const ready = useRef(false);
  const timer = useRef(0);

  useEffect(() => {
    ready.current = false;
  }, [resetKey]);

  useEffect(() => () => window.clearTimeout(timer.current), [storageKey]);

  const markReady = useCallback(() => {
    ready.current = true;
  }, []);

  const persist = useCallback(
    (viewport: StoredViewport) => {
      if (!ready.current) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        writeStoredViewport(storageKey, viewport);
      }, VIEWPORT_SAVE_MS);
    },
    [storageKey],
  );

  return { markReady, persist };
}

