'use client';
import { Popover } from '@base-ui/react/popover';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { OutlineActiveHeading, OutlineList, OutlineProgress } from './list';
import type { WorkspaceOutlineDropdownProps } from '@terrafirmagreg-team/kit/types/outline';

export function WorkspaceOutlineDropdown({
  trigger,
  content,
  header,
  footer,
  ...props
}: WorkspaceOutlineDropdownProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        {...trigger}
        className={cn(
          'flex items-center gap-2 min-w-0 h-8 px-1.5 -mx-1.5 rounded-lg text-start text-sm transition-colors',
          open
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
          trigger?.className,
        )}
      >
        <OutlineProgress className="shrink-0" />
        <OutlineActiveHeading
          fallback={t('On this page', { note: 'ui.on_this_page' })}
          activeClassName="text-foreground"
        />
        <ChevronDownIcon
          className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          sideOffset={8}
          positionMethod="fixed"
          className="z-50"
        >
          <Popover.Popup
            {...content}
            className={cn(
              'flex flex-col w-88 max-w-(--available-width) max-h-[min(28rem,var(--available-height))] p-3 rounded-2xl border bg-popover text-popover-foreground shadow-xl outline-none origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 motion-reduce:transition-none',
              content?.className,
            )}
          >
            {header}
            <OutlineList
              {...props}
              className="py-1"
              onSelect={() => setOpen(false)}
            />
            {footer}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

