'use client';

import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';

export function PanelSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <ul
      aria-hidden
      className="grid h-full w-full place-content-center gap-1"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, cols)}, 36px)`,
        gridTemplateRows: `repeat(${Math.max(1, rows)}, 36px)`,
      }}
    >
      {Array.from({ length: Math.max(1, cols) * Math.max(1, rows) }, (_, i) => (
        <li
          key={i}
          className="flex min-h-0 min-w-0 items-center justify-center"
        >
          <Skeleton className="size-9 rounded-sm" />
        </li>
      ))}
    </ul>
  );
}

