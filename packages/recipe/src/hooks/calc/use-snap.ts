'use client';

import { startTransition, useCallback } from 'react';
import {
  boolCodec,
  createStoredValue,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';

const useStoredSnap = createStoredValue('calc:snap', boolCodec(true));

export function useCalcSnap() {
  const [snap, setStored] = useStoredSnap();
  const setSnap = useCallback((next: boolean) => {
    startTransition(() => setStored(next));
  }, [setStored]);
  return [snap, setSnap] as const;
}
