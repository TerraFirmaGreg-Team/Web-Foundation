'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalculatorState } from '@terrafirmagreg-team/recipe/types/calc';

const HISTORY_LIMIT = 50;

export function useCalcHistory(
  state: CalculatorState,
  persist: (next: CalculatorState) => void,
  canvasId?: string,
) {
  const [stacks, setStacks] = useState<{
    past: CalculatorState[];
    future: CalculatorState[];
  }>({ past: [], future: [] });
  const stateRef = useRef(state);
  const pendingRef = useRef<CalculatorState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [prevCanvas, setPrevCanvas] = useState(canvasId);
  if (prevCanvas !== canvasId) {
    setPrevCanvas(canvasId);
    setStacks({ past: [], future: [] });
  }

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    persist(pending);
  });

  const write = useCallback(
    (next: CalculatorState) => {
      setStacks((s) => ({
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), stateRef.current],
        future: [],
      }));
      persist(next);
    },
    [persist],
  );

  const undo = useCallback(() => {
    setStacks((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      pendingRef.current = prev;
      return {
        past: s.past.slice(0, -1),
        future: [...s.future, stateRef.current],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setStacks((s) => {
      const next = s.future[s.future.length - 1];
      if (!next) return s;
      pendingRef.current = next;
      return {
        past: [...s.past, stateRef.current],
        future: s.future.slice(0, -1),
      };
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable]')) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return {
    write,
    undo,
    redo,
    canUndo: stacks.past.length > 0,
    canRedo: stacks.future.length > 0,
  };
}
