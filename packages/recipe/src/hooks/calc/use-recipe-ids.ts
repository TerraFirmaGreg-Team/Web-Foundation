'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
} from 'react';
import {
  boolCodec,
  createStoredValue,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';

const useStoredRecipeIds = createStoredValue(
  'calc:recipeIds',
  boolCodec(false),
);

const CalcRecipeIdsContext = createContext(false);

export const CalcRecipeIdsProvider = CalcRecipeIdsContext.Provider;

export function useCalcRecipeIds(): boolean {
  return useContext(CalcRecipeIdsContext);
}

export function useCalcRecipeIdsMode() {
  const [show, setStored] = useStoredRecipeIds();
  const setShow = useCallback((next: boolean) => {
    startTransition(() => setStored(next));
  }, [setStored]);
  return [show, setShow] as const;
}
