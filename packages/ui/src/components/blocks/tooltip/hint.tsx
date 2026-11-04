'use client';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';

export function Hint({
  label,
  children,
  ...props
}: {
  label: ReactNode;
  children: ReactElement;
} & Pick<
  ComponentProps<typeof TooltipContent>,
  'side' | 'align' | 'sideOffset'
>) {
  if (label == null || label === '') return children;
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent {...props}>{label}</TooltipContent>
    </Tooltip>
  );
}

