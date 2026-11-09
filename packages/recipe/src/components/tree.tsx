import 'server-only';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { createElement } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { loadMergedLangMap, creativeTabName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/load';
import { DUMP_POINTER_TTL } from '@terrafirmagreg-team/dump/lib/dump/json-reader';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { getRecipeSource } from '@terrafirmagreg-team/recipe/lib/source';
import { keyTreeNode } from '@terrafirmagreg-team/translate/server';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { encodeQueryValue } from '@terrafirmagreg-team/translate/lib/url';
import { recipeBasePath } from '@terrafirmagreg-team/recipe/lib/links';
import { sectionDatasets } from '@terrafirmagreg-team/kit/lib/datasets';
import type { DumpRecipeCategory } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { SectionTrees } from '@terrafirmagreg-team/kit/types';

function categoryIcon(
  dataset: DatasetRef,
  category: DumpRecipeCategory,
): React.ReactNode {
  if (!category.icon) return undefined;
  return createElement(
    'span',
    {
      key: 'icon',
      className: 'inline-flex size-4 shrink-0 items-center justify-center',
    },
    createElement(Entry, {
      dataset,
      reference: category.icon,
      name: category.id,
      size: 'sm',
      href: false,
      tooltip: false,
      missing: 'hide',
    }),
  );
}

function categoryLeaf(
  dataset: DatasetRef,
  category: DumpRecipeCategory,
  map: Record<string, string>,
): PageTree.Item {
  return keyTreeNode({
    type: 'page',
    name: creativeTabName(map, category.display?.name),
    url: `${recipeBasePath(dataset)}?type=${encodeQueryValue(category.id)}`,
    icon: categoryIcon(dataset, category),
    $id: `${dataset.id}/${dataset.version ?? ''}/type/${category.id}`,
  }) as PageTree.Item;
}

const recipeTreesCache = createAsyncCache(
  (lang: Lang): Promise<SectionTrees> => buildRecipeTrees(lang),
  (lang) => `recipe-trees/${lang}`,
  DUMP_POINTER_TTL,
);

export function recipeTrees(lang: Lang): Promise<SectionTrees> {
  return recipeTreesCache(lang);
}

async function buildRecipeTrees(lang: Lang): Promise<SectionTrees> {
  const { defaultLanguage } = loadLocaleRegistry();
  const datasets = await sectionDatasets('recipe');
  const trees: SectionTrees = {};
  for (const { id, title: datasetTitle, languages } of datasets) {
    if (!(languages ?? [defaultLanguage]).includes(lang)) continue;
    const ref = { id };
    const map = await loadMergedLangMap(ref, lang);
    const source = getRecipeSource();
    const categories = await source.categories(ref);
    const types = (await source.manifest(ref))?.indexes.recipes.types;
    const nonEmpty = types
      ? new Set(
          types.filter((row) => (row.count ?? 0) > 0).map((row) => row.id),
        )
      : undefined;
    const leaves = [...categories]
      .filter((category) => !nonEmpty || nonEmpty.has(category.id))
      .sort(
        (a, b) =>
          creativeTabName(map, a.display?.name).localeCompare(
            creativeTabName(map, b.display?.name),
          ) || a.id.localeCompare(b.id),
      )
      .map((category) => categoryLeaf(ref, category, map));
    (trees[lang] ??= {})[id] = {
      name: datasetTitle ?? id,
      children: leaves,
      $id: `recipe/${id}/${lang}`,
    } satisfies PageTree.Root;
  }
  return trees;
}

