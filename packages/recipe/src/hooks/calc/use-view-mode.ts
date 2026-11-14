'use client';

import { startTransition, useCallback } from 'react';
import {
  createStoredValue,
  literalCodec,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';
import type { CalcViewMode } from '@terrafirmagreg-team/recipe/lib/calc/flow';

const MODES: CalcViewMode[] = ['mini', 'normal', 'detailed'];
const useStoredMode = createStoredValue(
  'calc:view',
  literalCodec(MODES, 'detailed'),
);

export function useCalcViewMode() {
  const [mode, setStored] = useStoredMode();
  const setMode = useCallback(
    (next: CalcViewMode) => startTransition(() => setStored(next)),
    [setStored],
  );
  return [mode, setMode] as const;
}

