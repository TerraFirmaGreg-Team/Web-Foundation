'use client';

import { useAsyncEffect } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import type {
  CalcCard,
  CalcRecipe,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { useCalcWorker } from './use-worker';

type WorkerSlice = ReturnType<typeof useCalcWorker>;

export function useCalcResolver({
  catalog,
  inputKey,
  cards,
  recipeMap,
  worker,
}: {
  catalog: RecipeCompactIndex | null;
  inputKey: string;
  cards: CalcCard[];
  recipeMap: Map<string, CalcRecipe>;
  worker: WorkerSlice;
}) {
  const {
    ref: workerRef,
    state: workerState,
    generation,
    call,
    isResolved,
    markResolved,
  } = worker;
  useAsyncEffect(async () => {
    if (
      !catalog ||
      (!catalog.items.length && !catalog.fluids?.length) ||
      workerState === 'pending'
    ) {
      return;
    }
    if (!workerRef.current) return;
    if (isResolved(inputKey)) return;
    markResolved(inputKey);

    const materials = new Set<string>();
    const recipes = new Set<string>();
    const tags = new Set<string>();
    for (const card of cards) {
      if (card.materialId.startsWith('#')) tags.add(card.materialId);
      materials.add(card.materialId);
      if (card.recipeId) recipes.add(card.recipeId);
    }
    for (const card of cards) {
      if (!card.recipeId) continue;
      const recipe = recipeMap.get(card.recipeId);
      if (!recipe) continue;
      for (const input of recipe.inputs) {
        if (input.tagId) tags.add(input.tagId);
      }
    }
    await call((api) =>
      api.resolve({
        materials: [...materials],
        recipes: [...recipes],
        tags: [...tags],
      }),
    ).catch(() => {});
  }, [catalog, cards, recipeMap, workerState, generation, call, inputKey]);
}

