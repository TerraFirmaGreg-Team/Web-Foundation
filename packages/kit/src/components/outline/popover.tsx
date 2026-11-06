'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@terrafirmagreg-team/ui/components/ui/collapsible';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { ChevronDownIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTreePath } from '@terrafirmagreg-team/ui/hooks/use-tree';
import { OutlineActiveHeading, OutlineList, OutlineProgress } from './list';
import type { WorkspaceOutlinePopoverProps } from '@terrafirmagreg-team/kit/types/outline';

export function WorkspaceOutlinePopover({
  container,
  trigger,
  content,
  header,
  footer,
  ...props
}: WorkspaceOutlinePopoverProps) {
  const t = useTranslations();
  const page = useTreePath().at(-1);
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target))
        setOpen(false);
    };

    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      {...container}
      className={cn('max-md:layout:[--toc-popover-height:--spacing(10)]', container?.className)}
    >
      <header ref={ref} className="bg-card">
        <CollapsibleTrigger
          {...trigger}
          className={cn(
            'flex w-full h-10 items-center gap-2.5 px-4 text-start text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            trigger?.className,
          )}
        >
          <OutlineProgress
            size={18}
            className={cn('shrink-0', open && 'text-primary')}
          />
          <OutlineActiveHeading
            fallback={page?.name ?? t('On this page', { note: 'ui.on_this_page' })}
            className={cn('flex-1 transition-colors', open && 'text-foreground')}
          />
          <ChevronDownIcon
            className={cn('size-4 shrink-0 mx-0.5 transition-transform', open && 'rotate-180')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent {...content}>
          <div className="flex flex-col px-4 max-h-[50vh]">
            {header}
            <OutlineList {...props} onSelect={() => setOpen(false)} />
            {footer}
          </div>
        </CollapsibleContent>
      </header>
    </Collapsible>
  );
}

