'use client';

import { useRef, type TouchEvent } from 'react';

const MIN_DX = 48;

export function useSwipe(onSwipe: (dir: -1 | 1) => void, axis: 'x' | 'y' = 'x') {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const from = start.current;
      start.current = null;
      const touch = event.changedTouches[0];
      if (!from || !touch) return;
      const dx = touch.clientX - from.x;
      const dy = touch.clientY - from.y;
      const main = axis === 'y' ? dy : dx;
      const cross = axis === 'y' ? dx : dy;
      if (Math.abs(main) < MIN_DX || Math.abs(main) < Math.abs(cross) * 1.5) return;
      onSwipe(main < 0 ? 1 : -1);
    },
  };
}

