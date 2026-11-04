'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CalcCard,
  CalcWire,
  CalculatorState,
} from '@terrafirmagreg-team/recipe/types/calc';

export function useCalcAmounts({
  cards,
  wires,
  tagSelections,
  persist,
}: {
  cards: CalcCard[];
  wires: CalcWire[];
  tagSelections: Record<string, string>;
  persist: (next: CalculatorState) => void;
}) {
  const [pending, setPending] = useState<CalcCard[] | null>(null);
  const amountTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      if (amountTimer.current) clearTimeout(amountTimer.current);
    },
    [],
  );

  const flushAmounts = useCallback((): CalcCard[] => {
    if (amountTimer.current) {
      clearTimeout(amountTimer.current);
      amountTimer.current = undefined;
    }
    if (!pending) return cards;
    setPending(null);
    return pending;
  }, [pending, cards]);

  const onCrafts = useCallback(
    (cardId: string, crafts: number) => {
      const base = pending ?? cards;
      const next = base.map((card) =>
        card.id === cardId ? { ...card, crafts: Math.max(1, crafts) } : card,
      );
      setPending(next);
      if (amountTimer.current) clearTimeout(amountTimer.current);
      amountTimer.current = setTimeout(() => {
        amountTimer.current = undefined;
        setPending(null);
        persist({ cards: next, wires, tagSelections });
      }, 300);
    },
    [pending, cards, persist, wires, tagSelections],
  );

  return {
    displayCards: pending ?? cards,
    flushAmounts,
    onCrafts,
  };
}

