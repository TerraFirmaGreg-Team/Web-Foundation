'use client';

import { useRef, type ReactNode } from 'react';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';

export function FitBox({
  w,
  children,
}: {
  w: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { w: avail } = useElementSize(ref);
  const fit = w > 0 && avail > 0 ? Math.min(1, avail / w) : 1;
  return (
    <div ref={ref} className="w-full">
      <div
        className="mx-auto w-fit"
        style={fit < 1 ? { zoom: fit } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
