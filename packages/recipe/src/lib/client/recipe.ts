import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { parseRecipe } from '@terrafirmagreg-team/recipe/lib/data/parse';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import {
  clientDumpJson,
  loadClientManifest,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { clientRecipeLayout } from '@terrafirmagreg-team/recipe/lib/client/recipe-categories';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

const recipeIndex = createDatasetCache(async (dataset: DatasetRef, ns: string) => {
  const manifest = await loadClientManifest(dataset);
  const listed = manifest?.namespaces[ns];
  if (!listed || !listed.registry.includes('recipes')) return undefined;
  return asRecord(
    await clientDumpJson(dataset, 'registry/recipes.json', 'high'),
  ) as Record<string, string | string[]> | undefined;
});

export async function clientRecipeFileRels(
  dataset: DatasetRef,
  recipeId: string,
): Promise<string[]> {
  const ns = recipeId.split(':', 1)[0];
  if (!ns) return [];
  const index = await recipeIndex(dataset, ns);
  const value = index?.[recipeId];
  const categories = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [value]
      : [];
  return categories
    .filter(
      (category): category is string =>
        typeof category === 'string' && !!category,
    )
    .map((category) =>
      category.includes(':')
        ? category.slice(category.indexOf(':') + 1)
        : category,
    )
    .filter((path) => !!path)
    .map((path) => `data/${ns}/recipes/${path}.json`);
}

async function clientRecipeFileRel(
  dataset: DatasetRef,
  recipeId: string,
): Promise<string | undefined> {
  return (await clientRecipeFileRels(dataset, recipeId))[0];
}

export const loadClientRecipe: (
  dataset: DatasetRef,
  id: string,
  bucket?: string,
) => Promise<Recipe | undefined> = createDatasetCache(
  async (
    dataset: DatasetRef,
    id: string,
    bucket?: string,
  ): Promise<Recipe | undefined> => {
    const rel = bucket ?? (await clientRecipeFileRel(dataset, id));
    if (!rel) return undefined;
    const doc = asRecord(await clientDumpJson(dataset, rel, 'high'));
    const raw = doc?.[id];
    if (raw === undefined) return undefined;
    const ns = rel.split('/')[1] ?? '';
    const category = asString(asRecord(raw)?.category);
    const layout = category
      ? await clientRecipeLayout(dataset, category)
      : undefined;
    return parseRecipe(raw, {
      modId: ns,
      bodyUrl: dumpRelPublicUrl(dataset, rel) ?? `/${dataset.id}`,
      id,
      ...(layout ? { layout } : {}),
    });
  },
  (dataset, id, bucket) => JSON.stringify([dataset, id, bucket ?? '']),
);

