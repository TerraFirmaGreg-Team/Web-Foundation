import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { parseRecipe } from '@terrafirmagreg-team/recipe/lib/data/parse/index';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import {
  clientDumpJson,
  loadClientManifest,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { clientRecipeLayout } from '@terrafirmagreg-team/recipe/lib/client/recipe-categories';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import type {
  PreparedRecipeRow,
  RegistryRecipes,
} from '@terrafirmagreg-team/dump/lib/dump/gen';

const recipeIndex = createDatasetCache(async (dataset: DatasetRef) => {
  const manifest = await loadClientManifest(dataset);
  if (!manifest || !Object.values(manifest.namespaces).some(
    (namespace) => namespace?.registry.includes('recipes'),
  )) return undefined;
  return asRecord(
    await clientDumpJson(dataset, 'registry/recipes.ndjson', 'high'),
  ) as RegistryRecipes | undefined;
});

export async function clientPreparedRecipeRows(
  dataset: DatasetRef,
  recipeIds: Iterable<string>,
): Promise<PreparedRecipeRow[]> {
  const index = await recipeIndex(dataset);
  return [...new Set(recipeIds)].flatMap((id) => index?.[id] ?? []);
}

export async function clientRecipeFileRels(
  dataset: DatasetRef,
  recipeId: string,
): Promise<string[]> {
  return [...new Set(
    (await clientPreparedRecipeRows(dataset, [recipeId])).map((row) => row.bucket),
  )];
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
  (dataset, id, bucket) => datasetCacheKey(dataset, id, bucket ?? ''),
);
