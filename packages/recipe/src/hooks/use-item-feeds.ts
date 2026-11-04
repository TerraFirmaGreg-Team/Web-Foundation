'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import {
  recipesForOutput,
  usesForInput,
} from '@terrafirmagreg-team/recipe/lib/lookup';
import type { RecipeCompactIndex, RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';

export const EMPTY_ROWS: RecipeCompactRow[] = [];

export function useItemFeeds({
  dataset,
  index,
  indexLoading,
  item,
  kind,
}: {
  dataset: DatasetRef;
  index: RecipeCompactIndex | null;
  indexLoading: boolean;
  item: string;
  kind: 'item' | 'fluid';
}) {
  const recipesRes = useAsyncResult(
    () =>
      index
        ? recipesForOutput(dataset, index, item, { includeTagRows: false })
        : Promise.resolve(EMPTY_ROWS),
    [dataset, index, item],
  );
  const usesRes = useAsyncResult(
    () =>
      index
        ? usesForInput(dataset, index, item, kind)
        : Promise.resolve(EMPTY_ROWS),
    [dataset, index, item, kind],
  );
  return {
    recipes: recipesRes.value,
    uses: usesRes.value,
    pending: indexLoading || !index || recipesRes.pending || usesRes.pending,
  };
}

