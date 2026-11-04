'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useMemo } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useFluidColors } from '@terrafirmagreg-team/recipe/hooks/alloy/use-fluid-colors';
import type { AlloyComponent, AlloyMixRow } from '@terrafirmagreg-team/recipe/types/alloy';

const PALETTE = [
  'bg-amber-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-lime-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-teal-500',
];

export function AlloyStackBar({
  rows,
  colors,
  className,
  label,
}: {
  rows: readonly Pick<AlloyMixRow, 'percent' | 'valid'>[];
  colors?: readonly (string | undefined)[];
  className?: string;

  label?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-3 w-full overflow-hidden rounded bg-secondary',
        className,
      )}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rows.map((row, i) => {
        const color = colors?.[i];
        return (
          <div
            key={i}
            className={cn(
              'h-full transition-[width,background-color]',
              !color && PALETTE[i % PALETTE.length],
              !row.valid && 'opacity-40',
            )}
            style={{
              width: `${Math.max(0, Math.min(100, row.percent))}%`,
              ...(color ? { backgroundColor: color } : {}),
            }}
          />
        );
      })}
    </div>
  );
}

export function AlloyMiniBar({
  dataset,
  components,
  className,
}: {
  dataset: DatasetRef;
  components: readonly AlloyComponent[];
  className?: string;
}) {
  const slots = useMemo(() => components.map(({ slot }) => slot), [components]);
  const colors = useFluidColors(dataset, slots);
  const sum = components.reduce(
    (total, { slot }) => total + (slot.amount || 0),
    0,
  );
  return (
    <AlloyStackBar
      className={className}
      colors={colors}
      rows={components.map(({ slot }) => ({
        percent: sum > 0 ? (slot.amount / sum) * 100 : 0,
        valid: true,
      }))}
    />
  );
}

