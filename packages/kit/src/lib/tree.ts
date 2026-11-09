import type * as PageTree from 'fumadocs-core/page-tree';
import { localizePageTree } from '@terrafirmagreg-team/translate/server';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { sourceLanguages } from './languages';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { SectionDataset, SectionTrees } from '@terrafirmagreg-team/kit/types';
import type { SectionSource } from './page';

export function datasetId(node: PageTree.Folder): string | undefined {
  const segment = node.index?.url.split('/').filter(Boolean)[1];
  if (segment) return segment;
  const segments = node.$id?.split('/').filter(Boolean);
  return segments?.[segments.length - 1];
}

function datasetTree(
  tree: PageTree.Root,
  id: string,
  lang: Lang,
): PageTree.Root {
  const folder = tree.children.find(
    (node): node is PageTree.Folder =>
      node.type === 'folder' && datasetId(node) === id,
  );
  if (!folder) return { name: id, children: [], $id: `${id}:${lang}` };
  return { name: folder.name, children: folder.children, $id: `${id}:${lang}` };
}

export function localizedDatasetTrees(
  source: SectionSource,
  datasets: readonly SectionDataset[],
  lang?: Lang,
): SectionTrees {
  const { defaultLanguage } = loadLocaleRegistry();
  const tree = source.getPageTree();
  const options = {
    languages: sourceLanguages(source),
    fallbackLanguage: defaultLanguage,
  };
  const localized = new Map<string, PageTree.Root>();
  const localize = (code: Lang) => {
    let out = localized.get(code);
    if (!out) {
      out = localizePageTree(tree, code, options);
      localized.set(code, out);
    }
    return out;
  };
  const trees: SectionTrees = {};
  for (const dataset of datasets) {
    const langs = dataset.languages ?? [defaultLanguage];
    if (lang !== undefined && !langs.includes(lang)) continue;
    for (const code of (lang !== undefined ? [lang] : langs) as Lang[]) {
      (trees[code] ??= {})[dataset.id] = datasetTree(
        localize(code),
        dataset.id,
        code,
      );
    }
  }
  return trees;
}

