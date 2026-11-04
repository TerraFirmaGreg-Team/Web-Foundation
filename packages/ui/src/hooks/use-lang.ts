'use client';
import { createContext, useContext } from 'react';

export const UntranslatedContext = createContext(false);

export function useUntranslated(): boolean {
  return useContext(UntranslatedContext);
}

