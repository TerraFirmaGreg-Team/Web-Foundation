import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import type {
  RecipeCompactIndex,
  RecipeCompactRow,
} from '@terrafirmagreg-team/recipe/types';
import { clientDumpJson, loadClientManifest } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import type { RecipeTypeRow } from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';
import type {
  PreparedRecipeRow,
  RecipeRowsDocument,
} from '@terrafirmagreg-team/dump/lib/dump/gen';
import {
  clientPreparedRecipeRows,
  loadClientRecipe,
} from '@terrafirmagreg-team/recipe/lib/client/recipe';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { resolveDatasetSnapshot } from '@terrafirmagreg-team/dump/lib/dump/snapshot';

const typeRowsCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    typeId: string,
  ): Promise<PreparedRecipeRow[]> => {
    const type = (await recipeTypeRows(dataset)).find((entry) => entry.id === typeId);
    if (!type) return [];
    const document = await clientDumpJson(dataset, type.rows, 'high') as RecipeRowsDocument | undefined;
    return (document?.rows ?? []).toSorted(comparePreparedRows);
  },
  (dataset, typeId) => datasetCacheKey(dataset, typeId),
);

export async function recipeTypeRows(
  dataset: DatasetRef,
): Promise<RecipeTypeRow[]> {
  const manifest = await loadClientManifest(dataset);
  return manifest?.indexes.recipes.types ?? [];
}

function compactRow(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  row: PreparedRecipeRow,
): RecipeCompactRow {
  const typeIndex = index.types.indexOf(row.category);
  return {
    id: row.id,
    type: typeIndex < 0 ? 0 : typeIndex,
    ...(typeIndex < 0 ? { cat: row.category } : {}),
    ...(row.order != null ? { o: row.order } : {}),
    in: row.inputs,
    out: row.outputs,
    bodyUrl: dumpRelPublicUrl(dataset, row.bucket),
    ...(row.image ? { image: row.image } : {}),
    bucket: row.bucket,
    ...(row.w != null && row.h != null ? { d: { w: row.w, h: row.h } } : {}),
  };
}

function comparePreparedRows(a: PreparedRecipeRow, b: PreparedRecipeRow): number {
  return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
    || a.category.localeCompare(b.category)
    || a.id.localeCompare(b.id);
}

export async function loadTypeRows(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  typeId: string,
): Promise<RecipeCompactRow[]> {
  if (!index.types.includes(typeId)) return [];
  dataset = await resolveDatasetSnapshot(dataset);
  return (await typeRowsCache(dataset, typeId)).map((row) => compactRow(dataset, index, row));
}

export async function loadCategoryRecipes(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  typeId: string,
): Promise<Recipe[]> {
  dataset = await resolveDatasetSnapshot(dataset);
  const rows = await loadTypeRows(dataset, index, typeId);
  const seen = new Set<string>();
  const recipes = await Promise.all(
    rows.map(async (row) => {
      const key = `${row.cat ?? index.types[row.type]}|${row.id}`;
      if (seen.has(key)) return undefined;
      seen.add(key);
      const recipe = await loadClientRecipe(dataset, row.id, row.bucket);
      if (!recipe || recipe.type !== typeId) return undefined;
      return recipe;
    }),
  );
  return recipes.filter((recipe) => recipe !== undefined);
}

export const TAG_RECIPE_TYPE = 'emi:tag';

export async function resolveRecipeRows(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  ids: Iterable<string>,
  opts?: { includeTagRows?: boolean },
): Promise<RecipeCompactRow[]> {
  dataset = await resolveDatasetSnapshot(dataset);
  const prepared = await clientPreparedRecipeRows(dataset, ids);
  const seen = new Set<string>();
  const rows: PreparedRecipeRow[] = [];
  for (const row of prepared) {
    if (opts?.includeTagRows === false && row.category === TAG_RECIPE_TYPE) continue;
    const key = `${row.category}|${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows.sort(comparePreparedRows).map((row) => compactRow(dataset, index, row));
}
