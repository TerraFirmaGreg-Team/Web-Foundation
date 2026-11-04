import { useMemo } from 'react';
import type {
  RecipeCategory,
  RecipeCompactIndex,
} from '@terrafirmagreg-team/recipe/types';

export function useCategoriesById(
  index: RecipeCompactIndex | null | undefined,
): Map<string, RecipeCategory> {
  return useMemo(
    () =>
      new Map<string, RecipeCategory>(
        (index?.categories ?? []).map((row) => [row.id, row]),
      ),
    [index],
  );
}

