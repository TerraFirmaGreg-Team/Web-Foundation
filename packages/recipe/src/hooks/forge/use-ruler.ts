'use client';

import { useRef, useState } from 'react';

export const RULER = { numbersTop: 88, markerX: 13, trackBottom: 110 } as const;

export function useRuler({
  panelRef,
  scale,
  work,
  target,
  solving,
  onWork,
  onTarget,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  work: number;
  target: number | null;
  solving: boolean;
  onWork: (value: number) => void;
  onTarget: (value: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const dragKind = useRef<'work' | 'target' | null>(null);
  const applyRuler = (value: number) => {
    if (dragKind.current === 'work') {
      onWork(value);
    } else {
      onTarget(value);
    }
  };
  const rulerValue = (clientX: number): number => {
    const panel = panelRef.current?.getBoundingClientRect();
    if (!panel) return 0;
    const atlasX = (clientX - panel.left) / scale;
    return Math.max(0, Math.min(149, Math.round(atlasX - RULER.markerX)));
  };
  const beginDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    kind: 'work' | 'target',
  ) => {
    if (solving) return;
    dragKind.current = kind;
    applyRuler(rulerValue(event.clientX));
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {

    }
    setDragging(true);
  };

  const onRulerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const value = rulerValue(event.clientX);
    const nearWork = Math.abs(value - work) <= 4;
    const nearTarget = target !== null && Math.abs(value - target) <= 4;
    beginDrag(
      event,
      nearWork &&
        (!nearTarget || Math.abs(value - work) <= Math.abs(value - target))
        ? 'work'
        : 'target',
    );
  };
  const onRulerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragKind.current) return;
    applyRuler(rulerValue(event.clientX));
  };
  const onRulerUp = () => {
    dragKind.current = null;
    setDragging(false);
  };
  const onHandleKey =
    (kind: 'work' | 'target') =>
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const base = kind === 'work' ? work : (target ?? 0);
      const value = Math.max(
        0,
        Math.min(149, base + (event.key === 'ArrowRight' ? step : -step)),
      );
      if (kind === 'work') {
        onWork(value);
      } else {
        onTarget(value);
      }
    };
  return {
    dragging,
    beginDrag,
    onRulerDown,
    onRulerMove,
    onRulerUp,
    onHandleKey,
  };
}

