'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import type { ComponentProps, ReactNode } from 'react';
import { SidebarIcon } from 'lucide-react';
import { useSidebar } from '@terrafirmagreg-team/ui/hooks/use-sidebar';
import { SidebarCollapseTrigger, SidebarDrawerContent, SidebarDrawerOverlay, SidebarTrigger } from '@terrafirmagreg-team/ui/components/blocks/sidebar';
import { useLayout } from '@terrafirmagreg-team/ui/hooks/use-layout';
import { LeftSidebarContent } from './content';
import { LeftSidebarFooter } from './footer';
import type { LeftSidebarParts } from './context';

export function LeftSidebar({
  className,
  controls,
  content,
  footer,
  menu,
  match,
  navKeys,
  settings,
  ...props
}: LeftSidebarParts & Omit<ComponentProps<'aside'>, 'content'>) {
  const { mode } = useSidebar();
  const parts = { controls, content, footer, menu, match, navKeys, settings };
  return (
    <>
      {mode === 'full' && (
        <LeftSidebarAside className={className} {...parts} {...props} />
      )}
      <LeftSidebarDrawer {...parts} />
    </>
  );
}

function LeftSidebarAside({
  className,
  controls,
  content,
  footer,
  menu,
  match,
  navKeys,
  settings,
  ...props
}: LeftSidebarParts & Omit<ComponentProps<'aside'>, 'content'>) {
  const { collapsed } = useSidebar();
  const { navTitle: Title } = useLayout();
  return (
    <aside
      id="sidebar"
      data-slot="left-sidebar"
      data-collapsed={collapsed || undefined}
      inert={collapsed}
      className={cn(
        'flex min-h-0 w-67 flex-col overflow-hidden text-sm transition-[width,translate,opacity] duration-300 ease-expo *:transition-[opacity,translate] *:duration-200 data-[collapsed=true]:w-2 data-[collapsed=true]:*:pointer-events-none data-[collapsed=true]:*:opacity-0 data-[collapsed=true]:*:-translate-x-3 [grid-area:sidebar] md:layout:[--sidebar-width:268px] max-md:hidden',
        collapsed && 'md:layout:[--sidebar-col:--spacing(2)]',
        className,
      )}
      {...props}
    >
      <div className="flex min-h-0 flex-1 flex-col w-(--sidebar-width)">
        <LeftSidebarRegions
          title={
            <Title className="inline-flex items-center gap-2 min-w-0 me-auto text-nav-title font-semibold" />
          }
          collapse={
            <SidebarCollapseTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'size-8 text-muted-foreground! aria-expanded:bg-transparent',
              )}
            >
              <SidebarIcon />
            </SidebarCollapseTrigger>
          }
          controls={controls}
          content={content}
          footer={footer}
          menu={menu}
          match={match}
          navKeys={navKeys}
          settings={settings}
        />
      </div>
    </aside>
  );
}

function LeftSidebarDrawer(props: LeftSidebarParts) {
  const { navTitle: Title } = useLayout();
  return (
    <>
      <SidebarDrawerOverlay className="fixed z-40 inset-0 backdrop-blur-xs data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <SidebarDrawerContent className="fixed z-40 inset-e-0 inset-y-0 flex flex-col w-[85%] max-w-95 text-nav-title bg-background border-s shadow-lg data-[state=open]:animate-sidebar-in data-[state=closed]:animate-sidebar-out">
        <LeftSidebarRegions
          headerClassName="h-(--header-height) my-2 ps-5.5 pe-3"
          title={
            <Title className="inline-flex items-center gap-2 min-w-0 me-auto text-nav-title font-semibold" />
          }
          collapse={
            <SidebarTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                'size-8 text-muted-foreground',
              )}
            >
              <SidebarIcon />
            </SidebarTrigger>
          }
          contentClassName="mt-2"
          {...props}
        />
      </SidebarDrawerContent>
    </>
  );
}

function LeftSidebarRegions({
  title,
  collapse,
  controls,
  content,
  footer,
  menu,
  match,
  navKeys,
  settings,
  headerClassName,
  controlsClassName,
  contentClassName,
  viewportClassName,
  footerClassName,
}: LeftSidebarParts & {
  title?: ReactNode;
  collapse?: ReactNode;
  headerClassName?: string;
  controlsClassName?: string;
  contentClassName?: string;
  viewportClassName?: string;
  footerClassName?: string;
}) {
  return (
    <>
      {(title != null || collapse != null || menu != null) && (
        <header
          data-slot="left-sidebar-header"
          className={cn(
            'my-2 flex h-14 shrink-0 items-center gap-2 ps-5.5 pe-3',
            headerClassName,
          )}
        >
          {title}
          {menu}
          {collapse}
        </header>
      )}
      <div
        data-slot="left-sidebar-controls"
        className={cn(
          'flex shrink-0 flex-col gap-2 px-3 empty:hidden',
          controlsClassName,
        )}
      >
        {controls}
      </div>
      <LeftSidebarContent
        className={contentClassName}
        viewportClassName={viewportClassName}
        match={match}
        navKeys={navKeys}
      >
        {content}
      </LeftSidebarContent>
      {(footer ?? <LeftSidebarFooter settings={settings} />) != null && (
        <footer
          data-slot="left-sidebar-footer"
          className={cn(
            'flex shrink-0 flex-col gap-1.5 px-3 py-2.5 empty:hidden',
            footerClassName,
          )}
        >
          {footer ?? <LeftSidebarFooter settings={settings} />}
        </footer>
      )}
    </>
  );
}

