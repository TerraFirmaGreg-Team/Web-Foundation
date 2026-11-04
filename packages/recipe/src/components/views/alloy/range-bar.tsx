'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function AlloyRangeBar({
  min,
  max,
  value,
  color,
  label,
}: {
  min: number;
  max: number;
  value: number;
  color?: string;
  label?: string;
}) {
  const valid = value >= min - 1e-8 && value <= max + 1e-8;
  const bar = (
    <div className="relative h-2.5 w-full min-w-24 rounded bg-secondary">
      <div
        className={cn(
          'absolute inset-y-0 rounded transition-[background-color]',
          !color &&
            (valid
              ? 'bg-green-600/30 dark:bg-green-400/30'
              : 'bg-muted-foreground/25'),
        )}
        style={{
          left: `${min}%`,
          width: `${max - min}%`,
          ...(color ? { backgroundColor: color, opacity: 0.28 } : {}),
        }}
      />
      <div
        className={cn(
          'absolute -inset-y-0.5 w-0.5 rounded transition-[left,background-color]',
          !color && (valid ? 'bg-green-700 dark:bg-green-300' : 'bg-destructive'),
          color && !valid && 'bg-destructive',
        )}
        style={{
          left: `${Math.min(100, Math.max(0, value))}%`,
          ...(color && valid ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
  if (!label) return bar;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<div className="w-full" tabIndex={0} aria-label={label} />}
      >
        {bar}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

