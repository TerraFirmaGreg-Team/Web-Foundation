import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { loadClientRecipe } from '@terrafirmagreg-team/recipe/lib/client/recipe';
import { resolveClientTag } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import { recipesForOutput } from '@terrafirmagreg-team/recipe/lib/browser/lookup';
import { recipeDivisor, toCalcRecipe } from './tree';
import type { RecipeCompactIndex, RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';
import type {
  CalcKind,
  CalcRecipe,
  CalcRecipeSummary,
  TagResolution,
} from '@terrafirmagreg-team/recipe/types/calc';

export type SliceMaps = {
  recipes: Map<string, CalcRecipe>;
  bodies: Map<string, Recipe>;
  out: Map<string, RecipeCompactRow[]>;
  tags: Map<string, TagResolution>;
  dead: Set<string>;
};

export function mergeNew<K, V>(prev: Map<K, V>, src: Map<K, V>): Map<K, V> {
  let next: Map<K, V> | null = null;
  for (const [key, value] of src) {
    if (!prev.has(key)) (next ??= new Map(prev)).set(key, value);
  }
  return next ?? prev;
}

export function mergeSet<T>(
  prev: ReadonlySet<T>,
  src: ReadonlySet<T>,
): Set<T> | ReadonlySet<T> {
  let next: Set<T> | null = null;
  for (const value of src) {
    if (!prev.has(value)) (next ??= new Set(prev)).add(value);
  }
  return next ?? prev;
}

export function createFrameBudget(budgetMs = 24) {
  let last = performance.now();
  return async function yieldToInput() {
    const now = performance.now();
    if (now - last < budgetMs) return;
    last = now;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  };
}

export function tagMemberKind(registry: string | undefined): CalcKind {
  return registry === 'fluids' ? 'fluid' : 'item';
}

const summaryCaches = new WeakMap<
  object,
  WeakMap<object, Map<string, CalcRecipeSummary[]>>
>();

export function summaryCacheFor(
  outMap: Map<string, RecipeCompactRow[]>,
  recipeMap: Map<string, CalcRecipe>,
): Map<string, CalcRecipeSummary[]> {
  let inner = summaryCaches.get(outMap);
  if (!inner) summaryCaches.set(outMap, (inner = new WeakMap()));
  let map = inner.get(recipeMap);
  if (!map) inner.set(recipeMap, (map = new Map()));
  return map;
}

function buildSummaries(
  rows: RecipeCompactRow[],
  catalogTypes: string[],
  recipeMap: ReadonlyMap<string, CalcRecipe>,
  materialId: string,
  kind: CalcKind,
): CalcRecipeSummary[] {
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    if (seen.has(row.id)) return [];
    seen.add(row.id);
    const recipe = recipeMap.get(row.id);
    return [
      {
        recipeId: row.id,
        category: catalogTypes[row.type] ?? row.cat ?? row.id,
        outputAmount: recipe ? recipeDivisor(recipe, materialId, kind) : 1,
        row,
      },
    ];
  });
}

export function summarizeRecipes(
  outMap: ReadonlyMap<string, RecipeCompactRow[]>,
  recipeMap: ReadonlyMap<string, CalcRecipe>,
  catalogTypes: string[],
  cache: Map<string, CalcRecipeSummary[]>,
  materialId: string,
  kind: CalcKind,
): CalcRecipeSummary[] {
  const key = `${kind}:${materialId}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const list = buildSummaries(
    outMap.get(materialId) ?? [],
    catalogTypes,
    recipeMap,
    materialId,
    kind,
  );
  cache.set(key, list);
  return list;
}

export function createSummaries(
  catalog: RecipeCompactIndex,
  outMap: ReadonlyMap<string, RecipeCompactRow[]>,
  recipeMap: ReadonlyMap<string, CalcRecipe>,
) {
  const cache = new Map<string, CalcRecipeSummary[]>();
  return {
    get: (materialId: string, kind: CalcKind): CalcRecipeSummary[] =>
      summarizeRecipes(
        outMap,
        recipeMap,
        catalog.types,
        cache,
        materialId,
        kind,
      ),
    clear: () => cache.clear(),
  };
}

export type Wanted = {
  recipes: Set<string>;
  outs: Set<string>;
  tags: Set<string>;
};

export type FetchedSlices = {
  recipes: Map<string, { calc: CalcRecipe; body: Recipe }>;
  outs: Map<string, RecipeCompactRow[]>;
  tags: Map<string, TagResolution>;
  dead: Set<string>;
};

export async function fetchSlices(
  dataset: DatasetRef,
  catalog: RecipeCompactIndex,
  wanted: Wanted,
): Promise<FetchedSlices> {
  const [recipeRows, outRows, tagRows] = await Promise.all([
    Promise.all(
      [...wanted.recipes].map(async (id) => {
        const body = await loadClientRecipe(dataset, id).catch(() => undefined);
        return [id, body] as const;
      }),
    ),
    Promise.all(
      [...wanted.outs].map(async (id) => {
        const list = await recipesForOutput(dataset, catalog, id, {
          includeTagRows: false,
        }).catch(() => [] as RecipeCompactRow[]);
        return [id, list] as const;
      }),
    ),
    Promise.all(
      [...wanted.tags].map(async (id) => {
        const tag = await resolveClientTag(dataset, id).catch(() => undefined);
        return [id, tag] as const;
      }),
    ),
  ]);
  const recipes = new Map<string, { calc: CalcRecipe; body: Recipe }>();
  const dead = new Set<string>();
  for (const [id, body] of recipeRows) {
    if (!body) {
      dead.add(id);
      continue;
    }
    recipes.set(id, { calc: toCalcRecipe(body), body });
  }
  const outs = new Map(outRows);
  const tags = new Map<string, TagResolution>(
    tagRows.map(([id, tag]) => [
      id,
      {
        members: tag?.members?.length ? tag.members : [],
        kind: tagMemberKind(tag?.registry),
      },
    ]),
  );
  return { recipes, outs, tags, dead };
}

