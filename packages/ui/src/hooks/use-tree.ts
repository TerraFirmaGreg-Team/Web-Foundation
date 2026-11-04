'use client';
import { useMemo, createContext, use } from 'react';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import type { TabOption, TreeContextValue } from '@terrafirmagreg-team/ui/types/tree';
import { findProjection } from '@terrafirmagreg-team/ui/lib/tree';

export const TreeContext = createContext<TreeContextValue | null>(null);
export const PathContext = createContext<PageTree.Node[]>([]);

export function useTreePath(): PageTree.Node[] {
  return use(PathContext);
}

export function useTreeContext(): TreeContextValue {
  const ctx = use(TreeContext);
  if (!ctx)
    throw new Error('You must wrap this component under <DocsLayout />');
  return ctx;
}

export function useTabsGroups(tabs: TabOption[]): {
  active?: PageTree.Folder;
  options: TabOption[];
}[] {
  const { full: tree } = useTreeContext();
  const path = use(PathContext);

  return useMemo(() => {
    const out: { active?: PageTree.Folder; options: TabOption[] }[] = [];
    const last = path[path.length - 1];
    const page = last?.type === 'page' ? last : undefined;
    let scope = tree.fallback
      ? [...tree.children, ...tree.fallback.children]
      : tree.children;

    for (const node of path) {
      if (node.type !== 'folder' || !node.root) continue;
      const group = { active: node, options: [] as TabOption[] };
      collectTabs(scope, node, page, tabs, group.options);
      if (group.options.length > 0) out.push(group);
      scope = node.children;
    }

    const custom = tabs.filter((tab) => !tab.$folder);
    if (custom.length > 0) {
      const group = out.findLast((group) => group.active?.root === true);
      if (group) group.options.push(...custom);
      else out.push({ options: custom });
    }
    return out;
  }, [tabs, tree, path]);
}

function collectTabs(
  scope: PageTree.Node[],
  active: PageTree.Folder,
  page: PageTree.Item | undefined,
  tabs: TabOption[],
  out: TabOption[],
): void {
  for (const node of scope) {
    if (node.type !== 'folder') continue;
    if (node.root === active.root) {
      const tab = tabs.find(
        (tab) =>
          tab.$folder &&
          (tab.$folder === node || tab.$folder.$id === node.$id),
      );
      if (!tab) continue;
      const projection =
        page && findProjection(active, node, page);
      out.push(projection ? { ...tab, url: projection.url } : tab);
    } else if (!node.root) {
      collectTabs(node.children, active, page, tabs, out);
    }
  }
}

const footerCache = new WeakMap<PageTree.Root | PageTree.Folder, PageTree.Item[]>();

export function useFooterItems(): PageTree.Item[] {
  const { root } = useTreeContext();
  const cached = footerCache.get(root);
  if (cached) return cached;

  const list: PageTree.Item[] = [];
  function onNode(node: PageTree.Node): void {
    if (node.type === 'folder') {
      if (node.index) onNode(node.index);
      for (const child of node.children) onNode(child);
    } else if (node.type === 'page' && !node.external) {
      list.push(node);
    }
  }
  for (const child of root.children) onNode(child);

  footerCache.set(root, list);
  return list;
}

