import type * as PageTree from 'fumadocs-core/page-tree';

function typeParamFromRecipeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const query = url.split('?')[1];
  if (!query) return undefined;
  return new URLSearchParams(query).get('type') ?? undefined;
}

function collectRecipeLeaves(nodes: PageTree.Node[]): PageTree.Item[] {
  const out: PageTree.Item[] = [];
  for (const node of nodes) {
    if (node.type === 'page') out.push(node);
    else if (node.type === 'folder')
      out.push(...collectRecipeLeaves(node.children));
  }
  return out;
}

export function groupRecipeSidebarByMod(
  tree: PageTree.Root,
  modNames: Record<string, string>,
): PageTree.Root {
  const leaves = collectRecipeLeaves(tree.children);
  if (!leaves.length) return tree;
  const byMod: Record<string, PageTree.Item[]> = {};
  for (const leaf of leaves) {
    const mod = typeParamFromRecipeUrl(leaf.url)?.split(':', 1)[0] ?? '_';
    const list = byMod[mod];
    if (list) list.push(leaf);
    else byMod[mod] = [leaf];
  }
  const folders: PageTree.Folder[] = Object.entries(byMod)
    .map(([mod, children]) => ({
      type: 'folder' as const,
      name: modNames[mod] ?? mod,
      children,
      $id: `mod/${mod}`,
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return {
    name: tree.name,
    children: folders,
    $id: `${tree.$id}:mod`,
  };
}

