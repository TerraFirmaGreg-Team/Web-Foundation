import type * as PageTree from 'fumadocs-core/page-tree';
import type { SectionTrees } from '@terrafirmagreg-team/kit/types';

const GROUP_NAME = /^(\d+)\.(\d+)\.x$/;

const numbers = (value: string) => value.match(/\d+/g)?.map(Number) ?? [];

const descByVersion = (a: PageTree.Node, b: PageTree.Node) => {
  const an = numbers(String(a.name ?? ''));
  const bn = numbers(String(b.name ?? ''));
  for (let i = 0; i < Math.max(an.length, bn.length); i++) {
    const diff = (bn[i] ?? 0) - (an[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
};

function groupVersionItems(root: PageTree.Root): PageTree.Root {
  const children: PageTree.Node[] = [];
  const groups = new Map<string, PageTree.Folder>();
  for (const node of root.children) {
    const title = node.type === 'page' ? String(node.name ?? '') : '';
    const series = /^v?(\d+)\.(\d+)/.exec(title)?.slice(1, 3).join('.');
    if (node.type !== 'page' || !series) {
      children.push(node);
      continue;
    }
    let folder = groups.get(series);
    if (!folder) {
      folder = {
        $id: `${root.$id ?? 'root'}:${series}`,
        type: 'folder',
        name: `${series}.x`,
        children: [],
      };
      groups.set(series, folder);
      children.push(folder);
    }
    folder.children.push(node);
  }
  for (const folder of groups.values())
    folder.children.sort(descByVersion);
  const seriesOf = (node: PageTree.Node) =>
    node.type === 'folder' && typeof node.name === 'string'
      ? GROUP_NAME.exec(node.name)
      : null;
  children.sort((a, b) => {
    const sa = seriesOf(a);
    const sb = seriesOf(b);
    return sa && sb
      ? Number(sb[1]) - Number(sa[1]) || Number(sb[2]) - Number(sa[2])
      : 0;
  });
  return { ...root, children };
}

const TIMELINE_NAMES: Record<string, string> = {
  en_us: 'Timeline',
  ru_ru: 'Таймлайн',
};

export const groupTrees =
  (route: string, names: Record<string, string> = TIMELINE_NAMES) =>
  (trees: SectionTrees): SectionTrees =>
    Object.fromEntries(
      Object.entries(trees).map(([lang, byDataset]) => [
        lang,
        Object.fromEntries(
          Object.entries(byDataset).map(([id, root]) => {
            const grouped = groupVersionItems(root);
            const timeline: PageTree.Item = {
              type: 'page',
              name: names[lang] ?? 'Timeline',
              url: `${route}/${id}`,
            };
            return [
              id,
              { ...grouped, children: [timeline, ...grouped.children] },
            ];
          }),
        ),
      ]),
    );
