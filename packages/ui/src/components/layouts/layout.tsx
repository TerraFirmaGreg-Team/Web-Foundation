'use client';
import {
  useMemo,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import Link from '@terrafirmagreg-team/ui/components/blocks/nav/link';
import { SidebarIcon } from 'lucide-react';

import { LayoutContext, useLayout } from '@terrafirmagreg-team/ui/hooks/use-layout';
import { TreeContextProvider } from '@terrafirmagreg-team/ui/components/layouts/tree-context';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@terrafirmagreg-team/ui/components/blocks/sidebar';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { RightSidebar } from '@terrafirmagreg-team/ui/components/layouts/right-sidebar';
import {
  LeftSidebarPortalProvider,
  LeftSidebarSearch,
} from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';

export type LayoutProps = {
  tree: PageTree.Root;

  sidebar?: ReactNode;
  navTitle?: ComponentType<ComponentProps<'a'>>;
  header?: ReactNode;
  banner?: ReactNode;
  defaultOpenLevel?: number;
  children?: ReactNode;
};

const EmptyTitle: ComponentType<ComponentProps<'a'>> = (props) => (
  <Link href="/" {...props} />
);

export function Layout({
  tree,
  sidebar,
  navTitle: Title = EmptyTitle,
  header = <LayoutHeader />,
  banner,
  defaultOpenLevel = 0,
  children,
}: LayoutProps) {
  return (
    <LayoutContext value={useMemo(() => ({ navTitle: Title }), [Title])}>
      <TreeContextProvider tree={tree}>
        <SidebarProvider defaultOpenLevel={defaultOpenLevel}>
          <LeftSidebarPortalProvider>
            <div
              id="spacious-layout"
              data-slot="layout"
              className="relative grid min-h-(--layout-height) bg-card transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [--layout-height:calc(100dvh_-_var(--banner-height,0px))] [--header-height:--spacing(14)] [--page-width:100%] [--sidebar-width:0px] [--sidebar-col:var(--sidebar-width)] [--toc-width:0px] max-md:[--docs-row-3:calc(var(--banner-height,0px)+var(--header-height)+var(--toc-popover-height,0px))] md:h-(--layout-height) md:overflow-clip print:h-auto print:overflow-visible"
              style={{
                gridTemplate: `"banner banner banner" auto
"sidebar header right" auto
"sidebar toc-popover right" var(--toc-popover-height, 0px)
"sidebar main right" 1fr / var(--sidebar-col) minmax(0, 1fr) auto`,
              }}
            >
              {banner}
              {sidebar}
              {header}
              <RightSidebar>{children}</RightSidebar>
            </div>
          </LeftSidebarPortalProvider>
        </SidebarProvider>
      </TreeContextProvider>
    </LayoutContext>
  );
}

export function LayoutHeader({ className, ...props }: ComponentProps<'header'>) {
  const { navTitle: Title } = useLayout();
  return (
    <header
      id="subnav"
      data-slot="layout-header"
      className={cn(
        'sticky top-(--banner-height,0px) z-30 [grid-area:header] flex items-center h-(--header-height) ps-4 pe-2.5 bg-card md:hidden',
        className,
      )}
      {...props}
    >
      <Title className="inline-flex items-center gap-2.5 me-auto font-semibold" />
      <LeftSidebarSearch variant="icon" />
      <SidebarTrigger
        className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'p-2' })}
      >
        <SidebarIcon />
      </SidebarTrigger>
    </header>
  );
}

