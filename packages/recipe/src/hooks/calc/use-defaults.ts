'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useCallback, useEffect, useState } from 'react';
import {
  readRecipeDefaults,
  subscribeRecipeDefaults,
  writeRecipeDefault,
} from '@terrafirmagreg-team/recipe/lib/calc/defaults';

export function useRecipeDefaults(dataset: DatasetRef) {
  const [defaultsState, setDefaultsState] = useState<{
    dataset: DatasetRef;
    map: Record<string, string>;
  }>(() => ({ dataset, map: readRecipeDefaults(dataset) }));
  const defaults =
    defaultsState.dataset === dataset
      ? defaultsState.map
      : readRecipeDefaults(dataset);
  useEffect(
    () =>
      subscribeRecipeDefaults(() =>
        setDefaultsState({ dataset, map: readRecipeDefaults(dataset) }),
      ),
    [dataset],
  );

  const setRecipeDefault = useCallback(
    (materialId: string, recipeId: string | null) => {
      setDefaultsState({
        dataset,
        map: writeRecipeDefault(dataset, materialId, recipeId),
      });
    },
    [dataset],
  );

  return { defaults, setRecipeDefault };
}

