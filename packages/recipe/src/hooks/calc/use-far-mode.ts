'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
} from 'react';
import {
  createStoredValue,
  literalCodec,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';
import type { CalcFarMode } from '@terrafirmagreg-team/recipe/lib/calc/flow';

const FAR_MODES: CalcFarMode[] = ['full', 'preview', 'hidden'];
const useStoredMode = createStoredValue(
  'calc:far',
  literalCodec(FAR_MODES, 'full'),
);

const CalcFarContext = createContext<CalcFarMode>('full');

export const CalcFarProvider = CalcFarContext.Provider;

export function useCalcFar(): CalcFarMode {
  return useContext(CalcFarContext);
}

export function useCalcFarMode() {
  const [mode, setStored] = useStoredMode();
  const setMode = useCallback((next: CalcFarMode) => {

    startTransition(() => setStored(next));
  }, [setStored]);
  return [mode, setMode] as const;
}

