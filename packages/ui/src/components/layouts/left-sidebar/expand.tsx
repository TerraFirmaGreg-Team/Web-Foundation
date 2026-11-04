'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { SidebarIcon } from 'lucide-react';
import { useSidebar } from '@terrafirmagreg-team/ui/hooks/use-sidebar';
import { SidebarCollapseTrigger } from '@terrafirmagreg-team/ui/components/blocks/sidebar';

export function LeftSidebarExpand() {
  const { collapsed } = useSidebar();
  if (!collapsed) return;

  return (
    <SidebarCollapseTrigger
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
        '-ms-2 size-8 text-muted-foreground',
      )}
    >
      <SidebarIcon />
    </SidebarCollapseTrigger>
  );
}

