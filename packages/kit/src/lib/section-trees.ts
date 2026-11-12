import type * as PageTree from 'fumadocs-core/page-tree';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { SectionTrees } from '@terrafirmagreg-team/kit/types';

const registry = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.section-trees')
] ??= new Map<string, (lang: Lang) => Promise<SectionTrees>>()) as Map<
  string,
  (lang: Lang) => Promise<SectionTrees>
>;

export function registerSectionTrees(
  section: string,
  trees: (lang: Lang) => Promise<SectionTrees>,
): void {
  registry.set(section, trees);
}

export function sectionTreesLoader(
  section: string,
): ((lang: Lang) => Promise<SectionTrees>) | undefined {
  return registry.get(section);
}

export async function sectionTree(
  section: string,
  datasetId: string,
  lang: string,
): Promise<PageTree.Root | undefined> {
  const trees = await registry
    .get(section)
    ?.(lang as Lang)
    .catch(() => undefined);
  return trees?.[lang]?.[datasetId];
}
