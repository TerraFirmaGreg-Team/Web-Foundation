'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ComponentProps } from 'react';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { useHoverFollow } from '@terrafirmagreg-team/ui/hooks/use-hover-follow';
import type { NavItemMatch } from '@terrafirmagreg-team/ui/lib/utils/nav-active';
import { LeftSidebarPortalTarget } from './context';
import { LeftSidebarTree } from './tree';

export function LeftSidebarContent({
  children,
  match,
  navKeys,
  className,
  viewportClassName,
  ...props
}: ComponentProps<'div'> & {
  match?: NavItemMatch;
  navKeys?: ReadonlySet<string>;
  viewportClassName?: string;
}) {
  return (
    <ScrollArea.Root
      data-slot="left-sidebar-content"
      className={cn('relative min-h-0 flex-1', className)}
      {...props}
    >
      <ScrollArea.Viewport
        data-slot="left-sidebar-viewport"
        className={cn(
          'size-full overscroll-contain px-3 py-2 mask-[linear-gradient(to_bottom,transparent,white_12px,white_calc(100%-12px),transparent)]',
          viewportClassName,
        )}
      >
        <nav
          ref={useHoverFollow()}
          className="relative flex flex-col gap-1"
        >
          <div
            aria-hidden
            className="absolute top-0 left-0 py-0.5 rounded-lg bg-accent/60 bg-clip-content opacity-0 pointer-events-none transition-opacity duration-200 ease-expo motion-safe:transition-[translate,width,height,opacity]"
          />
          <LeftSidebarPortalTarget />
          <div data-slot="left-sidebar-tree" className="flex flex-col">
            {children ?? <LeftSidebarTree match={match} navKeys={navKeys} />}
          </div>
        </nav>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className={(state) =>
          cn(
            'flex h-full w-1.5 touch-none p-px transition-opacity select-none',
            !state.hovering && 'opacity-0',
          )
        }
      >
        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}

