'use client';

import { useState, type DependencyList, type ReactElement, type ReactNode } from 'react';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';

export function LazyTooltip<T>({
  load,
  deps = [],
  children,
  trigger,
  contentClassName,
  onOpenChange,
}: {
  load: () => Promise<T>;
  deps?: DependencyList;
  children: (value: T | undefined) => ReactNode;
  trigger: ReactElement;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const value = useAsyncValue(open ? load : false, [open, ...deps]);
  return (
    <Tooltip
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <TooltipTrigger render={trigger} delay={150} closeDelay={100} />
      <TooltipContent className={contentClassName}>
        {children(value)}
      </TooltipContent>
    </Tooltip>
  );
}
