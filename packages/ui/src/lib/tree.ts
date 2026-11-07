import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';

export function skeletonTree(id = 'sidebar:skeleton'): PageTree.Root {
  return { name: '', children: [], $id: id, $skeleton: true } as PageTree.Root;
}

export function isSkeletonTree(
  tree: PageTree.Root | PageTree.Folder | undefined,
): boolean {
  return (tree as { $skeleton?: boolean } | undefined)?.$skeleton === true;
}

export function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (!url.startsWith('/')) url = `/${url}`;
  if (url.length > 1 && url.endsWith('/')) url = url.slice(0, -1);
  return url;
}

export function findPath(
  nodes: PageTree.Node[],
  matcher: (node: PageTree.Node) => boolean,
  options: { includeSeparator?: boolean } = {},
): PageTree.Node[] | null {
  const { includeSeparator = true } = options;

  function run(nodes: PageTree.Node[]): PageTree.Node[] | undefined {
    let separator: PageTree.Node | undefined;
    for (const node of nodes) {
      if (matcher(node)) {
        const items: PageTree.Node[] = [];
        if (separator) items.push(separator);
        items.push(node);
        return items;
      }
      if (node.type === 'separator' && includeSeparator) {
        separator = node;
        continue;
      }
      if (node.type === 'folder') {
        const items =
          node.index && matcher(node.index)
            ? [node.index]
            : run(node.children);
        if (items) {
          items.unshift(node);
          if (separator) items.unshift(separator);
          return items;
        }
      }
    }
  }

  return run(nodes) ?? null;
}

export function searchPath(
  nodes: PageTree.Node[],
  url: string,
): PageTree.Node[] | null {
  const normalizedUrl = normalizeUrl(url);
  return findPath(
    nodes,
    (node) => node.type === 'page' && node.url === normalizedUrl,
  );
}

export function findProjection(
  from: PageTree.Folder,
  to: PageTree.Folder,
  page: PageTree.Item,
): PageTree.Item | undefined {
  const path = findPath(from.children, (node) => node === page, {
    includeSeparator: false,
  });
  if (!path) return;

  let target: PageTree.Node[] = to.children;
  let projection: PageTree.Item | undefined;
  outer: for (let i = 1; i < path.length; i++) {
    const segment = path[i];
    for (const node of target) {
      if (node.$id === segment.$id && node.type === 'page') {
        projection = node;
        continue outer;
      }
      if (
        node.type === 'folder' &&
        segment.type === 'folder' &&
        (node.$id === segment.$id || node === segment)
      ) {
        target = node.children;
        continue outer;
      }
    }
    return;
  }
  return projection;
}

