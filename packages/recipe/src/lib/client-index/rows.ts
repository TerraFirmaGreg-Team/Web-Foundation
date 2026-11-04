import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type {
  RecipeCompactIndex,
  RecipeCompactRow,
} from '@terrafirmagreg-team/recipe/types';
import { clientDumpJson, loadClientManifest } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { asNumber, asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import {
  asTaggedReference,
  stackIdFromRef,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { RecipeTypeRow } from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';
import {
  clientRecipeFileRels,
  loadClientRecipe,
} from '@terrafirmagreg-team/recipe/lib/client/recipe';
import {
  outputBoundary,
  slotIoRole,
} from '@terrafirmagreg-team/recipe/lib/data/slot-io';
import type { DumpRecipeLayout } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import type {
  Recipe,
  RecipeSlotType,
} from '@terrafirmagreg-team/recipe/lib/data/dto';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

const typeRowsCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    index: RecipeCompactIndex,
    typeId: string,
  ): Promise<RecipeCompactRow[]> => {
    const typeIndex = index.types.indexOf(typeId);
    if (typeIndex < 0) return [];
    const row = (await recipeTypeRows(dataset)).find(
      (entry) => entry.id === typeId,
    );
    if (!row?.files) return [];
    const layout = categoryLayout(index, typeId);
    const buckets = await Promise.all(
      Object.values(row.files).map(async (rel) => {
        if (!rel) return [];
        const bucket = await loadBucket(dataset, rel);
        return Object.entries(bucket).flatMap(([id, raw]) => {
          const parsed = rowFromBucketEntry(
            dataset,
            id,
            raw,
            typeIndex,
            rel,
            layout,
          );
          return parsed ? [parsed] : [];
        });
      }),
    );
    return buckets
      .flat()
      .sort(
        (a, b) =>
          (a.o ?? Number.MAX_SAFE_INTEGER) - (b.o ?? Number.MAX_SAFE_INTEGER),
      );
  },
  (dataset, _index, typeId) => `${dataset.id}/${dataset.version ?? ''} ${typeId}`,
);

const bucketCache = createDatasetCache(
  async (dataset: DatasetRef, rel: string): Promise<Record<string, unknown>> => {
    const raw = await clientDumpJson(dataset, rel, 'high');
    return asRecord(raw) ?? {};
  },
  (dataset, rel) => `${dataset.id}/${dataset.version ?? ''} ${rel}`,
);

export async function recipeTypeRows(
  dataset: DatasetRef,
): Promise<RecipeTypeRow[]> {
  const manifest = await loadClientManifest(dataset);
  return manifest?.indexes.recipes.types ?? [];
}

const categoryLayoutCache = new WeakMap<
  RecipeCompactIndex,
  Map<string, DumpRecipeLayout>
>();

function categoryLayout(
  index: RecipeCompactIndex,
  typeId: string | undefined,
): DumpRecipeLayout | undefined {
  if (!typeId) return undefined;
  let map = categoryLayoutCache.get(index);
  if (!map) {
    map = new Map();
    for (const cat of index.categories ?? []) {
      if (cat.layout) map.set(cat.id, cat.layout);
    }
    categoryLayoutCache.set(index, map);
  }
  return map.get(typeId);
}

function slotRefIds(
  raw: unknown,
  role: 'input' | 'output',
  layout?: DumpRecipeLayout,
): string[] {
  const slots = asRecord(raw);
  if (!slots) return [];
  const boundary = outputBoundary(
    slots as Record<string, { type?: unknown; x?: unknown } | undefined>,
    layout,
  );
  const laid = layout
    ? new Map(layout.slots.map((slot) => [slot.id, slot]))
    : undefined;
  const out: string[] = [];
  for (const [slotId, slot] of Object.entries(slots)) {
    const row = asRecord(slot);
    const ref = asTaggedReference(row?.ref);
    if (!ref) continue;
    const slotType = asString(row?.type) ?? 'input';
    const x = asNumber(row?.x) ?? laid?.get(slotId)?.x;
    if (slotIoRole(slotType as RecipeSlotType, x, boundary) === role) {
      out.push(stackIdFromRef(ref));
    }
  }
  return out;
}

function rowFromBucketEntry(
  dataset: DatasetRef,
  id: string,
  raw: unknown,
  typeIndex: number,
  rel: string,
  layout?: DumpRecipeLayout,
): RecipeCompactRow | undefined {
  const recipe = asRecord(raw);
  if (!recipe) return undefined;
  const w = asNumber(recipe.w);
  const h = asNumber(recipe.h);
  const image = asString(recipe.image);
  const order = asNumber(recipe.order);
  return {
    id,
    type: typeIndex,
    ...(order != null ? { o: order } : {}),
    in: slotRefIds(recipe.slots, 'input', layout),
    out: slotRefIds(recipe.slots, 'output', layout),
    bodyUrl: dumpRelPublicUrl(dataset, rel),
    ...(image ? { image } : {}),
    bucket: rel,
    ...(w != null && h != null ? { d: { w, h } } : {}),
  };
}

function loadBucket(
  dataset: DatasetRef,
  rel: string,
): Promise<Record<string, unknown>> {
  return bucketCache(dataset, rel);
}

export function loadTypeRows(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  typeId: string,
): Promise<RecipeCompactRow[]> {
  return typeRowsCache(dataset, index, typeId);
}

export async function loadCategoryRecipes(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  typeId: string,
): Promise<Recipe[]> {
  const rows = await loadTypeRows(dataset, index, typeId);
  const seen = new Set<string>();
  const recipes = await Promise.all(
    rows.map(async (row) => {
      if (seen.has(row.id)) return undefined;
      seen.add(row.id);
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
  const includeTagRows = opts?.includeTagRows ?? true;
  const wanted = new Set<string>();
  const byBucket = new Map<string, Set<string>>();
  for (const id of ids) {
    if (!id || wanted.has(id)) continue;
    wanted.add(id);
    const rels = await clientRecipeFileRels(dataset, id);
    for (const rel of rels) {
      const set = byBucket.get(rel);
      if (set) set.add(id);
      else byBucket.set(rel, new Set([id]));
    }
  }
  const out: RecipeCompactRow[] = [];
  const seen = new Set<string>();
  await Promise.all(
    [...byBucket.entries()].map(async ([rel, idsInBucket]) => {
      const bucket = await loadBucket(dataset, rel);
      for (const id of idsInBucket) {
        const raw = bucket[id];
        const category = asString(asRecord(raw)?.category);
        const typeIndex = category ? index.types.indexOf(category) : -1;
        if (!includeTagRows && category === TAG_RECIPE_TYPE) continue;
        const row = rowFromBucketEntry(
          dataset,
          id,
          raw,
          typeIndex < 0 ? 0 : typeIndex,
          rel,
          categoryLayout(index, category),
        );
        if (row && typeIndex < 0 && category) row.cat = category;
        if (row && !seen.has(row.id)) {
          seen.add(row.id);
          out.push(row);
        }
      }
    }),
  );

  const byBase = new Map<string, RecipeCompactRow>();
  for (const row of out) {
    const base = row.id.replace(/\/dup_\d+$/, '');
    const key = `${row.type}:${base}`;
    const prev = byBase.get(key);
    if (
      !prev ||
      (/\/dup_\d+$/.test(prev.id) && !/\/dup_\d+$/.test(row.id))
    ) {
      byBase.set(key, row);
    }
  }
  const deduped = [...byBase.values()];
  deduped.sort(
    (a, b) => (a.o ?? Number.MAX_SAFE_INTEGER) - (b.o ?? Number.MAX_SAFE_INTEGER),
  );
  return deduped;
}

