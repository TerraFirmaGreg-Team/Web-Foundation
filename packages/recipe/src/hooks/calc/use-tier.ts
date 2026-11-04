'use client';

import { createContext, useContext } from 'react';
import type { CalcTier } from '@terrafirmagreg-team/recipe/lib/calc/flow';

const CalcTierContext = createContext<CalcTier>('near');

export const CalcTierProvider = CalcTierContext.Provider;

export function useCalcTier(): CalcTier {
  return useContext(CalcTierContext);
}

