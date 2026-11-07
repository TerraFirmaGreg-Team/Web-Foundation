'use client';

import { PagerArrow } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function RecipeTabsSkeleton({
  count = 9,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn('flex min-h-9 items-center gap-1', className)}
    >
      <PagerArrow dir={-1} disabled onClick={() => {}} />
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="size-9 shrink-0 rounded-sm" />
        ))}
      </div>
      <PagerArrow dir={1} disabled onClick={() => {}} />
    </div>
  );
}

export function RecipeHeaderSkeleton() {
  return (
    <div aria-hidden className="flex items-start gap-3">
      <Skeleton className="size-8 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Skeleton className="h-3 w-20 rounded-sm" />
        <Skeleton className="h-4 w-40 rounded-sm" />
      </div>
    </div>
  );
}

export function RecipePanelSkeleton({
  cols,
  rows,
}: {
  cols: number;
  rows: number;
}) {
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

