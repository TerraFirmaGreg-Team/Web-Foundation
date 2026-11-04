'use client';
import { useTOCItems } from '@terrafirmagreg-team/kit/hooks/use-toc';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { TextIcon } from 'lucide-react';
import {
  RightSidebarPanel,
  RightSidebarPortal,
} from '@terrafirmagreg-team/ui/components/layouts/right-sidebar';
import { OutlineList } from './list';
import type { OutlineProps } from '@terrafirmagreg-team/kit/types/outline';

export function Outline({ container, header, footer, ...props }: OutlineProps) {
  const t = useTranslations();
  const items = useTOCItems();
  if (items.length === 0 && !header && !footer) return;

  return (
    <div
      data-slot="outline"
      {...container}
      className={cn('flex min-h-0 flex-col overflow-clip', container?.className)}
    >
      {header}
      <h3 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <TextIcon className="size-4" />
        {t('On this page', { note: 'ui.on_this_page' })}
      </h3>
      <OutlineList {...props} />
      {footer}
    </div>
  );
}

export function RightSidebarOutline({ container, ...props }: OutlineProps) {
  return (
    <RightSidebarPortal>
      <RightSidebarPanel className="pt-8 pb-4">
        <Outline
          {...props}
          container={{
            ...container,
            className: cn('flex-1', container?.className),
          }}
        />
      </RightSidebarPanel>
    </RightSidebarPortal>
  );
}

