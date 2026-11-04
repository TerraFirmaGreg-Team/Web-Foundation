'use client';
import type { ComponentProps, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import type { TOCItemType } from '@terrafirmagreg-team/kit/components/toc/base';
import { TOCProvider } from '@terrafirmagreg-team/kit/components/toc/base';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import {
  RightSidebarOutline,
  WorkspaceOutlineDropdown,
  WorkspaceOutlinePopover,
  type OutlineProps,
  type WorkspaceOutlinePopoverProps,
} from '@terrafirmagreg-team/kit/components/outline';
import { LeftSidebarExpand } from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { Breadcrumb } from '@terrafirmagreg-team/ui/components/blocks/nav/breadcrumb';
import { WorkspaceFooter } from './content';
import { WorkspacePagination } from './pagination';

export type WorkspacePaginationItems = {
  previous?: Pick<PageTree.Item, 'name' | 'description' | 'url'>;
  next?: Pick<PageTree.Item, 'name' | 'description' | 'url'>;
};

export type WorkspaceProps = ComponentProps<'article'> & {
  toc?: TOCItemType[];

  full?: boolean;
  outline?: OutlineProps & { enabled?: boolean; single?: boolean };
  outlinePopover?: WorkspaceOutlinePopoverProps & { enabled?: boolean };
  breadcrumb?: {
    items?: { name: string; url?: string }[];
    previews?: Record<string, PagePreviewData>;
  };
  pagination?: { items?: WorkspacePaginationItems } | false;

  actions?: ReactNode;

  footer?: ReactNode;
};

export function Workspace({
  toc = [],
  full = false,
  outline = {},
  outlinePopover = {},
  breadcrumb,
  pagination = {},
  actions,
  footer,
  className,
  children,
  ...props
}: WorkspaceProps) {
  const { enabled: outlineEnabled = !full, single, ...outlineProps } = outline;
  const { enabled: popoverEnabled = Boolean(toc.length > 0 || outlinePopover.header || outlinePopover.footer), ...popoverProps } = outlinePopover;
  const crumbs = breadcrumb?.items ?? [];
  const hasCrumbs = crumbs.length > 0;
  const pathname = usePathname();

  return (
    <TOCProvider
      single={single}
      toc={outlineEnabled || popoverEnabled ? toc : []}
    >
      <div
        data-slot="workspace-outline-popover"
        className="sticky top-[calc(var(--banner-height,0px)+var(--header-height))] z-30 [grid-area:toc-popover] self-start md:hidden"
      >
        {popoverEnabled && <WorkspaceOutlinePopover {...popoverProps} />}
        <div className="absolute inset-x-2 top-full h-[calc(var(--layout-height)_-_var(--header-height)_-_100%)] rounded-t-2xl border-x border-t outline-8 outline-card [clip-path:inset(0_-8px_-8px)] bg-origin-border bg-linear-to-b from-background to-transparent to-[16px] pointer-events-none" />
      </div>
      <div
        key={pathname}
        id="page-panel"
        data-slot="workspace-panel"
        className="@container relative flex flex-col min-w-0 min-h-0 [grid-area:main] mx-2 bg-background md:ms-0 md:my-2 md:overflow-clip md:rounded-2xl md:border md:shadow-sm print:overflow-visible"
      >
        <header
          data-slot="workspace-header"
          className={cn(
            'absolute inset-x-0 top-0 z-10 flex items-center gap-1.5 h-(--header-height) ps-6 pe-4 bg-linear-to-b from-background to-transparent pointer-events-none *:pointer-events-auto max-md:hidden',
            hasCrumbs || popoverEnabled ? 'from-50%' : 'to-40%',
          )}
        >
          <LeftSidebarExpand />
          {hasCrumbs && (
            <Breadcrumb
              items={crumbs}
              previews={breadcrumb?.previews}
            />
          )}
          {popoverEnabled && (
            <div
              className={cn(
                'flex items-center gap-1.5 min-w-0 transition-[opacity,visibility] duration-300 motion-reduce:transition-none',
                outlineEnabled &&
                  'invisible opacity-0 @max-5xl:visible @max-5xl:opacity-100 @max-5xl:transition-none',
              )}
            >
              {hasCrumbs && (
                <span className="text-sm text-muted-foreground/50">/</span>
              )}
              <WorkspaceOutlineDropdown {...popoverProps} />
            </div>
          )}
          <div data-slot="workspace-actions" className="ms-auto">
            {actions}
          </div>
        </header>
        <div
          data-slot="workspace-scroll"
          className="flex flex-1 items-start px-4 md:min-h-0 md:pt-(--header-height) md:px-[max(--spacing(6),calc((100%_-_var(--page-width)_-_var(--toc-width))/2))] md:overflow-y-auto md:overscroll-y-contain md:scrollbar-thin md:scrollbar-gutter-stable md:[--docs-height:calc(var(--layout-height)_-_var(--spacing)*4_-_2px_-_var(--header-height))]"
        >
          <article
            id="page"
            data-slot="workspace"
            data-full={full}
            className={cn(
              'flex flex-col gap-4 w-full min-w-0 max-w-(--page-width) pt-6 pb-8',
              className,
            )}
            {...props}
          >
            {hasCrumbs && (
              <Breadcrumb
                items={crumbs}
                previews={breadcrumb?.previews}
                className="md:hidden"
              />
            )}
            {children}
            {pagination !== false || footer ? (
              <WorkspaceFooter>
                {pagination !== false && (
                  <WorkspacePagination items={pagination.items} />
                )}
                {footer}
              </WorkspaceFooter>
            ) : null}
          </article>
          {outlineEnabled && <RightSidebarOutline {...outlineProps} />}
        </div>
      </div>
    </TOCProvider>
  );
}

