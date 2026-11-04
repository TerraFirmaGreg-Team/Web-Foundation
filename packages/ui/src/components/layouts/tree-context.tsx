'use client';
import { usePathname } from 'next/navigation';
import { useMemo, useRef, type ReactNode } from 'react';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import { PathContext, TreeContext } from '@terrafirmagreg-team/ui/hooks/use-tree';
import { searchPath } from '@terrafirmagreg-team/ui/lib/tree';

export function TreeContextProvider({
  tree: rawTree,
  children,
}: {
  tree: PageTree.Root;
  children: ReactNode;
}) {
  const nextIdRef = useRef(0);
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reset memoized tree only when its $id changes
  const tree = useMemo(() => rawTree, [rawTree.$id]);

  const path = useMemo(() => {
    return (
      searchPath(tree.children, pathname) ??
      (tree.fallback ? searchPath(tree.fallback.children, pathname) : null) ??
      []
    );
  }, [tree, pathname]);

  const root =
    (path.findLast(
      (item) => item.type === 'folder' && item.root,
    ) as PageTree.Folder | undefined) ?? tree;
  root.$id ??= String(nextIdRef.current++);

  return (
    <TreeContext
      value={useMemo(() => ({ root, full: tree }), [root, tree])}
    >
      <PathContext value={path}>{children}</PathContext>
    </TreeContext>
  );
}

