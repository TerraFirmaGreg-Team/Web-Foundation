'use client';
import { type ComponentProps, type ReactNode } from 'react';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';

export function ButtonCopy({
  value,
  copy,
  copied,
  className,
  title,
  ...props
}: Omit<ComponentProps<typeof Button>, 'value' | 'onCopy' | 'children'> & {
  value: string;
  copy: ReactNode;
  copied: ReactNode;
}) {
  const { checked: done, onClick } = useCopyButton(() =>
    navigator.clipboard.writeText(value),
  );
  const button = (
    <Button
      variant="ghost"
      size="xs"
      className={cn(
        'shrink-0 text-2xs text-muted-foreground hover:text-foreground',
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      {...props}
    >
      {done ? copied : copy}
    </Button>
  );
  return title ? <Hint label={title}>{button}</Hint> : button;
}

