'use client';
import type { ComponentProps } from 'react';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { useInFloatBar } from '@terrafirmagreg-team/ui/hooks/viewer/use-in-float-bar';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function IconButton({
  label,
  tooltip = true,
  overlay,
  variant = 'outline',
  size = 'icon-sm',
  className,
  ...props
}: ComponentProps<typeof Button> & {
  label: string;
  tooltip?: boolean;
  overlay?: boolean;
}) {
  const inFloatBar = useInFloatBar();
  const button = (
    <Button
      variant={overlay && variant === 'outline' ? 'ghost' : variant}
      size={size}
      aria-label={label}
      className={cn(
        overlay &&
          (inFloatBar
            ? 'rounded-none'
            : 'bg-float/92 backdrop-blur-md hover:bg-float'),
        className,
      )}
      {...props}
    />
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

