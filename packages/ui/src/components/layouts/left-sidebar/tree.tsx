'use client';
import {
  createContext,
  use,
  useMemo,
  type ReactNode,
} from 'react';
import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import { useTreeContext, useTreePath } from '@terrafirmagreg-team/ui/hooks/use-tree';
import { useLocaleRegistry } from '@terrafirmagreg-team/translate/hooks/use-locale-registry';
import { useLocationSearch } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
  hasActiveDescendant,
  isNavItemActive,
  langScopeKey,
  type NavItemMatch,
} from '@terrafirmagreg-team/ui/lib/utils/nav-active';
import {
  LeftSidebarFolder,
  LeftSidebarFolderContent,
  LeftSidebarFolderLink,
  LeftSidebarFolderTrigger,
  LeftSidebarItem,
  LeftSidebarLabel,
} from './items';
import { isSkeletonTree } from '@terrafirmagreg-team/ui/lib/tree';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';

const TREE_SKELETON_ROWS = [
  'w-3/5',
  'w-4/5 ms-4',
  'w-2/3 ms-4',
  'w-1/2 ms-4',
  'w-3/4',
  'w-1/2 ms-4',
  'w-2/3 ms-4',
  'w-3/5',
];

export function LeftSidebarTreeSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-1 px-1 py-2">
      {TREE_SKELETON_ROWS.map((width, i) => (
        <Skeleton key={i} className={`h-7 ${width}`} />
      ))}
    </div>
  );
}

type TreeRenderer = (props: {
  item: PageTree.Node;
  children: ReactNode;
}) => ReactNode;

const RendererContext = createContext<{
  Separator?: TreeRenderer;
  Item?: TreeRenderer;
  Folder?: TreeRenderer;
  pathname: string;
  search: string;
  match?: NavItemMatch;
  navKeys?: ReadonlySet<string>;
} | null>(null);

export function LeftSidebarTree({
  tree,
  match,
  navKeys,
  Separator,
  Item,
  Folder,
}: {
  tree?: PageTree.Root;
  match?: NavItemMatch;
  navKeys?: ReadonlySet<string>;
  Separator?: TreeRenderer;
  Item?: TreeRenderer;
  Folder?: TreeRenderer;
}) {
  const { root } = useTreeContext();
  const pathname = usePathname();
  const search = useLocationSearch();
  const { languages } = useLocaleRegistry();
  const resolved = tree ?? root;
  const ctxValue = useMemo(
    () => ({ Separator, Item, Folder, pathname, search, match, navKeys }),
    [Separator, Item, Folder, pathname, search, match, navKeys],
  );
  if (isSkeletonTree(resolved)) return <LeftSidebarTreeSkeleton />;
  return (
    <RendererContext value={ctxValue}>
      <Fragment key={langScopeKey(resolved.$id, languages)}>
        {resolved.children.map((node, i) => (
          <LeftSidebarTreeItem key={i} node={node} />
        ))}
      </Fragment>
    </RendererContext>
  );
}

export function LeftSidebarTreeItem({ node }: { node: PageTree.Node }) {
  const ctx = use(RendererContext);
  const path = useTreePath();
  if (!ctx) return null;
  const {
    Separator: CustomSeparator,
    Item: CustomItem,
    Folder: CustomFolder,
    pathname,
    search,
    match,
    navKeys,
  } = ctx;
  const isActive: NavItemMatch =
    match ?? ((url) => isNavItemActive(url, pathname, search, navKeys));
  if (node.type === 'separator') {
    if (CustomSeparator)
      return <CustomSeparator item={node}>{null}</CustomSeparator>;
    return (
      <LeftSidebarLabel>
        {node.icon}
        {node.name}
      </LeftSidebarLabel>
    );
  }
  if (node.type === 'folder') {
    if (CustomFolder)
      return (
        <CustomFolder item={node}>
          {node.children.map((child, i) => (
            <LeftSidebarTreeItem key={i} node={child} />
          ))}
        </CustomFolder>
      );
    return (
      <LeftSidebarFolder
        collapsible={node.collapsible}
        active={
          path.includes(node) || hasActiveDescendant(node, isActive)
        }
        defaultOpen={node.defaultOpen}
      >
        {node.index ? (
          <LeftSidebarFolderLink
            href={node.index.url}
            active={isActive(node.index.url)}
            external={node.index.external}
          >
            {node.icon}
            {node.name}
          </LeftSidebarFolderLink>
        ) : (
          <LeftSidebarFolderTrigger>
            {node.icon}
            {node.name}
          </LeftSidebarFolderTrigger>
        )}
        <LeftSidebarFolderContent>
          {node.children.map((child, i) => (
            <LeftSidebarTreeItem key={i} node={child} />
          ))}
        </LeftSidebarFolderContent>
      </LeftSidebarFolder>
    );
  }
  if (CustomItem) return <CustomItem item={node}>{null}</CustomItem>;
  return (
    <LeftSidebarItem
      href={node.url}
      external={node.external}
      active={isActive(node.url)}
      icon={node.icon}
    >
      {node.name}
    </LeftSidebarItem>
  );
}

