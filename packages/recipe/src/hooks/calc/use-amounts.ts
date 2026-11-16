'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CalcCard,
  CalcNode,
  CalcNote,
  CalcPipe,
  CalculatorState,
} from '@terrafirmagreg-team/recipe/types/calc';

export function useCalcAmounts({
  cards,
  pipes,
  tagSelections,
  notes,
  resolved,
  persist,
}: {
  cards: CalcCard[];
  pipes: CalcPipe[];
  tagSelections: Record<string, string>;
  notes: CalcNote[];
  resolved: CalcNode[];
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

  if (pending) {
    const settled = pending.every(
      (card) =>
        (resolved.find((node) => node.id === card.id)?.crafts ??
          card.crafts) === card.crafts,
    );
    if (settled) setPending(null);
  }

  const flushAmounts = useCallback((): CalcCard[] => {
    if (amountTimer.current) {
      clearTimeout(amountTimer.current);
      amountTimer.current = undefined;
    }
    if (!pending) return cards;
    return pending;
  }, [pending, cards]);

  const onCrafts = useCallback(
    (cardId: string, crafts: number | ((current: number) => number)) => {
      const base = pending ?? cards;
      const next = base.map((card) =>
        card.id === cardId
          ? {
              ...card,
              crafts: Math.max(
                1,
                typeof crafts === 'function' ? crafts(card.crafts) : crafts,
              ),
            }
          : card,
      );
      setPending(next);
      if (amountTimer.current) clearTimeout(amountTimer.current);
      amountTimer.current = setTimeout(() => {
        amountTimer.current = undefined;
        persist({ cards: next, pipes, tagSelections, notes });
      }, 300);
    },
    [pending, cards, persist, pipes, tagSelections, notes],
  );

  const pendingCrafts = useMemo(
    () =>
      pending
        ? new Map(pending.map((card) => [card.id, card.crafts]))
        : null,
    [pending],
  );

  return {
    displayCards: pending ?? cards,
    pendingCrafts,
    flushAmounts,
    onCrafts,
  };
}

