'use client';

import { createContext, useContext } from 'react';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

const CalcSessionContext = createContext<RecipeSession | null>(null);

export const CalcSessionProvider = CalcSessionContext.Provider;

export function useCalcSession(): RecipeSession | null {
  return useContext(CalcSessionContext);
}

