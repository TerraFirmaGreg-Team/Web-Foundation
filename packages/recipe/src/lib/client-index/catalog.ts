import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { RecipeChrome, RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { recipeTypeRows } from './rows';

const emptyRecipeIndex = (): RecipeCompactIndex => ({
  types: [],
  items: [],
  names: {},
});

async function loadRecipeStructureFromDump(
  dataset: DatasetRef,
  chrome: RecipeChrome,
): Promise<RecipeCompactIndex> {
  const rows = await recipeTypeRows(dataset);
  const typeCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.id) typeCounts[row.id] = row.count ?? 0;
  }
  return {
    types: rows.map((row) => row.id),
    typeCounts,
    items: chrome.items,
    names: chrome.names,
    ...(chrome.fluids?.length ? { fluids: chrome.fluids } : {}),
    ...(chrome.usedIds?.length ? { usedIds: chrome.usedIds } : {}),
    ...(chrome.tabs?.length ? { tabs: chrome.tabs } : {}),
    ...(chrome.tabItems ? { tabItems: chrome.tabItems } : {}),
    ...(chrome.categories?.length ? { categories: chrome.categories } : {}),
    ...(chrome.mods ? { mods: chrome.mods } : {}),
    ...(chrome.groups?.length ? { groups: chrome.groups } : {}),
  };
}

const indexCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    chrome?: RecipeChrome,
  ): Promise<RecipeCompactIndex> => {
    if (!chrome) return emptyRecipeIndex();
    return loadRecipeStructureFromDump(dataset, chrome);
  },
  (dataset, chrome) =>
    `${dataset.id}/${dataset.version ?? ''} ${chrome ? (Object.keys(chrome.names)[0] ?? '') : ''}`,
);

const skeletonCache = createDatasetCache(
  async (dataset: DatasetRef): Promise<RecipeCompactIndex> =>
    loadDatasetRecipeCategories(dataset).then((categories) =>
      loadRecipeStructureFromDump(dataset, {
        items: [],
        names: {},
        ...(categories.length ? { categories } : {}),
      }),
    ),
);

export function loadRecipeCompactIndex(
  dataset: DatasetRef,
  chrome?: RecipeChrome,
): Promise<RecipeCompactIndex> {
  return indexCache(dataset, chrome);
}

export function loadRecipeSkeletonIndex(
  dataset: DatasetRef,
): Promise<RecipeCompactIndex> {
  return skeletonCache(dataset);
}

export function nonEmptyCategoryIds(
  index: RecipeCompactIndex | null,
): string[] {
  const counts = index?.typeCounts;
  if (!counts) return [];
  return (index?.categories ?? [])
    .map((row) => row.id)
    .filter((id) => (counts[id] ?? 0) > 0);
}

export function recipeItemName(
  names: Record<string, Record<string, string>>,
  lang: string,
  id: string,
): string {
  return stackDisplayName(names[lang] ?? names.en_us, id);
}

