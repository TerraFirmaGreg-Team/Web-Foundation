'use client';

import type * as PageTree from 'fumadocs-core/page-tree';
import { TreeContextProvider } from '@terrafirmagreg-team/ui/components/layouts/tree-context';
import {
  LeftSidebarPortal,
  LeftSidebarTree,
} from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { Input } from '@terrafirmagreg-team/ui/components/ui/input';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';

export function ToolList({
  tree,
  loaded,
  query,
  onQuery,
  searchLabel,
  emptyLabel,
}: {
  tree: PageTree.Root;
  loaded: boolean;
  query: string;
  onQuery: (query: string) => void;
  searchLabel: string;
  emptyLabel: string;
}) {
  return (
    <LeftSidebarPortal>
      <div className="space-y-2 p-2">
        <Input
          type="search"
          name="tool-search"
          autoComplete="off"
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
        <TreeContextProvider tree={tree}>
          <LeftSidebarTree />
        </TreeContextProvider>
        {loaded && !tree.children.length ? (
          <EmptyState>{emptyLabel}</EmptyState>
        ) : null}
      </div>
    </LeftSidebarPortal>
  );
}

