import { registryId } from '@terrafirmagreg-team/recipe/lib/browser/lookup';
import type { RecipeCompactIndex, UsedItems } from '@terrafirmagreg-team/recipe/types';

export function recipeUsedItems(index: RecipeCompactIndex | null): UsedItems {
  const ids = new Set<string>();
  const bases = new Set<string>();
  for (const id of index?.usedIds ?? []) {
    ids.add(id);
    bases.add(registryId(id));
  }
  return { ids, bases };
}

function isRecipeUsed(id: string, used: UsedItems): boolean {
  return used.ids.has(id) || used.bases.has(registryId(id));
}

export function filterUsedIds(ids: string[], used: UsedItems): string[] {
  return ids.filter((id) => isRecipeUsed(id, used));
}

export function hasRecipeUsage(used: UsedItems): boolean {
  return used.ids.size > 0;
}

