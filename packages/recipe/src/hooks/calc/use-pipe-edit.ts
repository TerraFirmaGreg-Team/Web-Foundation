'use client';

import { createContext, useContext } from 'react';

export type CalcPipeEdit = {
  edgeId: string | null;
  open: (edgeId: string) => void;
  close: () => void;
};

const CalcPipeEditContext = createContext<CalcPipeEdit>({
  edgeId: null,
  open: () => {},
  close: () => {},
});

export const CalcPipeEditProvider = CalcPipeEditContext.Provider;

export function useCalcPipeEdit() {
  return useContext(CalcPipeEditContext);
}
