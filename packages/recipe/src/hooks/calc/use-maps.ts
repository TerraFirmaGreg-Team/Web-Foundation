'use client';

import { startTransition, useCallback, useDeferredValue, useState } from 'react';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { mergeNew, mergeSet } from '@terrafirmagreg-team/recipe/lib/calc/resolve';
import type { RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';
import type { CalcRecipe, TagResolution } from '@terrafirmagreg-team/recipe/types/calc';

export type CalcMaps = {
  recipeMap: Map<string, CalcRecipe>;
  bodyMap: Map<string, Recipe>;
  outMap: Map<string, RecipeCompactRow[]>;
  tagMap: Map<string, TagResolution>;
  deadIds: ReadonlySet<string>;
};

export type CalcMapsSlice = Partial<{
  out: Map<string, RecipeCompactRow[]>;
  tag: Map<string, TagResolution>;
  recipes: Map<string, CalcRecipe>;
  bodies: Map<string, Recipe>;
  dead: Set<string>;
}>;

export function useCalcMaps() {
  const [recipeMap, setRecipeMap] = useState<Map<string, CalcRecipe>>(
    () => new Map(),
  );
  const [bodyMap, setBodyMap] = useState<Map<string, Recipe>>(() => new Map());
  const [outMap, setOutMap] = useState<Map<string, RecipeCompactRow[]>>(
    () => new Map(),
  );
  const [tagMap, setTagMap] = useState<Map<string, TagResolution>>(
    () => new Map(),
  );
  const [deadIds, setDeadIds] = useState<ReadonlySet<string>>(() => new Set());

  const dataOutMap = useDeferredValue(outMap);
  const dataRecipeMap = useDeferredValue(recipeMap);
  const dataTagMap = useDeferredValue(tagMap);
  const dataDeadIds = useDeferredValue(deadIds);

  const applyMaps = useCallback((src: CalcMapsSlice, extra?: () => void) => {
    startTransition(() => {
      if (src.out) setOutMap((prev) => mergeNew(prev, src.out!));
      if (src.tag) setTagMap((prev) => mergeNew(prev, src.tag!));
      if (src.recipes) setRecipeMap((prev) => mergeNew(prev, src.recipes!));
      if (src.bodies) setBodyMap((prev) => mergeNew(prev, src.bodies!));
      if (src.dead) setDeadIds((prev) => mergeSet(prev, src.dead!));
      extra?.();
    });
  }, []);

  const resetMaps = useCallback(() => {
    startTransition(() => {
      setOutMap(new Map());
      setTagMap(new Map());
      setRecipeMap(new Map());
      setBodyMap(new Map());
      setDeadIds(new Set());
    });
  }, []);

  return {
    maps: { recipeMap, bodyMap, outMap, tagMap, deadIds },
    data: {
      outMap: dataOutMap,
      recipeMap: dataRecipeMap,
      tagMap: dataTagMap,
      deadIds: dataDeadIds,
    },
    applyMaps,
    resetMaps,
  };
}

