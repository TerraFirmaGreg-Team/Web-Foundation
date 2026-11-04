'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { onCalcFocusRequest } from '@terrafirmagreg-team/recipe/lib/calc/focus';
import type { CalcCard } from '@terrafirmagreg-team/recipe/types/calc';

export function useCalcFocus(cards: CalcCard[]) {
  const focusNodeRef = useRef<((materialId: string) => void) | null>(null);
  const onFocusNode = useCallback(
    (materialId: string) => focusNodeRef.current?.(materialId),
    [],
  );
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<{
    id: string;
    seen: CalcCard[];
  } | null>(null);

  useEffect(
    () => onCalcFocusRequest((id) => setPendingFocus({ id, seen: cards })),
    [cards],
  );

  if (pendingFocus && pendingFocus.seen !== cards) {
    setFocusNodeId(cards[cards.length - 1]?.id ?? null);
    setPendingFocus(null);
  }

  return { focusNodeRef, onFocusNode, focusNodeId, setFocusNodeId };
}

