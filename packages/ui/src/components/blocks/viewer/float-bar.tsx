'use client';
import { type ComponentProps, type ReactNode } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

import { FloatBarContext } from '@terrafirmagreg-team/ui/hooks/viewer/use-in-float-bar';

export function FloatBar({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <FloatBarContext.Provider value>
      <div
        role="group"
        data-slot="float-bar"
        className={cn(
          'no-scrollbar flex h-7 items-stretch overflow-x-auto rounded-lg bg-float/92 shadow-sm ring-1 ring-foreground/10 backdrop-blur-md',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </FloatBarContext.Provider>
  );
}

export function FloatBarItem({
  label,
  className,
  children,
}: {
  label?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      data-slot="float-bar-item"
      className={cn(
        'inline-flex items-center justify-center gap-1 px-3 font-mono text-[11.5px] leading-none whitespace-pre text-foreground',
        className,
      )}
    >
      {label != null && (
        <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-foreground/65">
          {label}
        </span>
      )}
      {children}
    </span>
  );
}

