'use client';

import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import { loadCategoryRecipes } from '@terrafirmagreg-team/recipe/lib/client-index';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';

export function useToolRecipes<T>(
  session: RecipeSession | null,
  category: string,
  parse: (recipe: Recipe) => T,
): { value: T[] | undefined; pending: boolean } {
  const index = session?.index;
  const dataset = session?.dataset;

  return useAsyncResult(
    index && dataset
      ? () =>
          loadCategoryRecipes(dataset, index, category).then((recipes) =>
            recipes.map(parse),
          )
      : undefined,
    [dataset, index, category, parse],
  );
}

