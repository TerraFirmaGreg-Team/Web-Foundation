'use client';

import type { HTMLAttributes } from 'react';
import { useMarquee } from '@terrafirmagreg-team/ui/hooks/use-marquee';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function Marquee({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const ref = useMarquee<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      className={cn('block min-w-0 overflow-hidden', className)}
      {...props}
    >
      <span className="marquee-inner block whitespace-nowrap">{children}</span>
    </span>
  );
}
