import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { RecipeChrome } from '@terrafirmagreg-team/recipe/types';
import {
  clientDumpJson,
  clientDumpNames,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { parseCatalogLabels, parsePreparedCatalog } from './prepared-catalog';

const loadCatalog = createDatasetCache(async (dataset: DatasetRef) =>
  parsePreparedCatalog(await clientDumpJson(dataset, 'registry/catalog.json')),
);

const loadChrome = createDatasetCache(
  async (dataset: DatasetRef, lang: string): Promise<RecipeChrome> => {
    const [catalog, labels] = await Promise.all([
      loadCatalog(dataset),
      clientDumpJson(dataset, `lang/${lang}.catalog.json`).then(parseCatalogLabels),
    ]);
    return {
      items: catalog.items,
      fluids: catalog.fluids,
      usedIds: catalog.usedIds,
      tabs: catalog.tabs,
      tabItems: catalog.tabItems,
      categories: catalog.categories,
      groups: catalog.groups.map((group) => ({
        ...group,
        name: labels.groups[group.id],
      })),
      mods: labels.mods,
      names: { [lang]: labels.names },
    };
  },
);

const loadEntityNames = createDatasetCache(
  (dataset: DatasetRef, lang: string): Promise<Record<string, string>> =>
    clientDumpNames(dataset, lang),
  (dataset, lang) => datasetCacheKey(dataset, lang),
);

export function loadRecipeChromeClient(
  dataset: DatasetRef,
  lang: string,
): Promise<RecipeChrome> {
  return loadChrome(dataset, lang);
}

export function loadRecipeEntityNames(
  dataset: DatasetRef,
  _chrome: RecipeChrome,
  lang: string,
): Promise<Record<string, string>> {
  return loadEntityNames(dataset, lang);
}
