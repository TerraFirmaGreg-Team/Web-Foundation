import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeCompactIndex, RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';
import type { CalcRecipe, TagResolution } from '@terrafirmagreg-team/recipe/types/calc';
import type { FlushHandler } from './protocol';

export type CalcWorkerState = {
  dataset: DatasetRef;
  catalog: RecipeCompactIndex | null;
  onFlush: FlushHandler;
  outMap: Map<string, RecipeCompactRow[]>;
  tagMap: Map<string, TagResolution>;
  recipeMap: Map<string, CalcRecipe>;
  bodyMap: Map<string, Recipe>;
  deadIds: Set<string>;

  epoch: number;
  resolveGen: number;
};

export const state: CalcWorkerState = {
  dataset: { id: '' },
  catalog: null,
  onFlush: () => {},
  outMap: new Map(),
  tagMap: new Map(),
  recipeMap: new Map(),
  bodyMap: new Map(),
  deadIds: new Set(),
  epoch: 0,
  resolveGen: 0,
};

export function resetWorkerState(
  nextDataset: DatasetRef,
  nextCatalog: RecipeCompactIndex,
) {
  state.dataset = nextDataset;
  state.catalog = nextCatalog;
  state.resolveGen += 1;
  state.epoch += 1;
  state.outMap.clear();
  state.tagMap.clear();
  state.recipeMap.clear();
  state.bodyMap.clear();
  state.deadIds.clear();
}

