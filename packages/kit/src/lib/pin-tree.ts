import type * as PageTree from 'fumadocs-core/page-tree';

function pinUrl(url: string, from: string, version: string): string {
  const next = url[from.length];
  if (!url.startsWith(from) ||
      (next !== undefined && next !== '/' && next !== '?' && next !== '#')) return url;
  const [pathQuery, hash] = url.split('#');
  const [path, query] = pathQuery.split('?');
  const params = new URLSearchParams(query);
  params.set('version', version);
  return `${path}?${params}${hash === undefined ? '' : `#${hash}`}`;
}

export function pinTreeDataset(
  tree: PageTree.Root,
  section: string,
  datasetId: string,
  version: string,
): PageTree.Root {
  const from = `/${section}/${datasetId}`;
  const pinNode = (node: PageTree.Node): PageTree.Node => {
    if (node.type === 'page') {
      return { ...node, url: pinUrl(node.url, from, version) };
    }
    if (node.type === 'folder') {
      return {
        ...node,
        index: node.index
          ? { ...node.index, url: pinUrl(node.index.url, from, version) }
          : node.index,
        children: node.children.map(pinNode),
      };
    }
    return node;
  };
  return {
    ...tree,
    $id: `${tree.$id ?? `${section}/${datasetId}`}@${version}`,
    children: tree.children.map(pinNode),
  };
}

