import type { CalcKind, CalcRecipe, CalcRecipeSummary } from '@terrafirmagreg-team/recipe/types/calc';
import { fetchSlices, summarizeRecipes } from '@terrafirmagreg-team/recipe/lib/calc/resolve';
import type { Pending } from './flush';
import { state } from './state';

export function createWorkerSummaries(
  localRecipes: ReadonlyMap<string, CalcRecipe>,
) {
  const cache = new Map<string, CalcRecipeSummary[]>();
  return {
    get: (materialId: string, kind: CalcKind): CalcRecipeSummary[] =>
      summarizeRecipes(
        state.outMap,
        localRecipes,
        state.catalog?.types ?? [],
        cache,
        materialId,
        kind,
      ),
    clear: () => cache.clear(),
  };
}

export async function fetchWanted(
  pending: Pending,
  wanted: Set<string>,
  wantedOut: Set<string>,
  wantedTag: Set<string>,
  localRecipes: Map<string, CalcRecipe>,
): Promise<boolean> {
  if (!state.catalog) return false;
  const slices = await fetchSlices(state.dataset, state.catalog, {
    recipes: wanted,
    outs: wantedOut,
    tags: wantedTag,
  });
  let progressed = false;
  for (const id of slices.dead) {
    if (state.deadIds.has(id)) continue;
    state.deadIds.add(id);
    pending.dead.add(id);
    pending.dirty = true;
  }
  for (const [id, entry] of slices.recipes) {
    localRecipes.set(id, entry.calc);
    state.bodyMap.set(id, entry.body);
    pending.recipes.set(id, entry.calc);
    pending.bodies.set(id, entry.body);
    pending.dirty = true;
    progressed = true;
  }
  for (const [id, list] of slices.outs) {
    state.outMap.set(id, list);
    pending.out.set(id, list);
    pending.dirty = true;
    progressed = true;
  }
  for (const [id, resolution] of slices.tags) {
    state.tagMap.set(id, resolution);
    pending.tag.set(id, resolution);
    pending.dirty = true;
    progressed = true;
  }
  return progressed;
}

