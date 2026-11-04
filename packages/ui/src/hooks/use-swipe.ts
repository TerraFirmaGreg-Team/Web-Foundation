'use client';

import { useRef, type TouchEvent } from 'react';

const MIN_DX = 48;

export function useSwipe(onSwipe: (dir: -1 | 1) => void) {
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
      if (Math.abs(dx) < MIN_DX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      onSwipe(dx < 0 ? 1 : -1);
    },
  };
}

