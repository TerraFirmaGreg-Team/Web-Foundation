'use client';
import type { ComponentProps, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import { LeftSidebarExpand } from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { Breadcrumb } from '@terrafirmagreg-team/ui/components/blocks/nav/breadcrumb';
import { WorkspaceFooter } from './content';
import { WorkspacePagination } from './pagination';

export type WorkspacePaginationItems = {
  previous?: Pick<PageTree.Item, 'name' | 'description' | 'url'>;
  next?: Pick<PageTree.Item, 'name' | 'description' | 'url'>;
};

export type WorkspaceProps = ComponentProps<'article'> & {
  full?: boolean;
  outlineDropdown?: ReactNode;
  breadcrumb?: {
    items?: { name: string; url?: string }[];
    previews?: Record<string, PagePreviewData>;
  };
  pagination?: { items?: WorkspacePaginationItems } | false;
  actions?: ReactNode;
  footer?: ReactNode;
};

export function Workspace({
  full = false,
  outlineDropdown,
  breadcrumb,
  pagination = {},
  actions,
  footer,
  className,
  children,
  ...props
}: WorkspaceProps) {
  const crumbs = breadcrumb?.items ?? [];
  const hasCrumbs = crumbs.length > 0;
  const pathname = usePathname();

  return (
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
          hasCrumbs || outlineDropdown ? 'from-50%' : 'to-40%',
        )}
      >
        <LeftSidebarExpand />
        {hasCrumbs && (
          <Breadcrumb items={crumbs} previews={breadcrumb?.previews} />
        )}
        {outlineDropdown}
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
            'flex flex-col gap-4 w-full min-w-0 max-w-(--page-width) pt-6 pb-8 md:min-h-(--docs-height)',
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
      </div>
    </div>
  );
}
