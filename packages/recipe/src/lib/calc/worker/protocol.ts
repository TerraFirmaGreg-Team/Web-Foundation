import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';
import type {
  CalcRecipe,
  TagResolution,
} from '@terrafirmagreg-team/recipe/types/calc';

export type ResolveInput = {
  materials?: string[];
  recipes?: string[];
  tags?: string[];
};

export type CalcWorkerFlush = {
  epoch: number;
  out: [string, RecipeCompactRow[]][];
  tag: [string, TagResolution][];
  recipes: [string, CalcRecipe][];
  bodies: [string, Recipe][];
  dead: string[];
};

export type FlushHandler = (msg: CalcWorkerFlush) => void;

export type CalcWorkerApi = {
  init(
    dataset: DatasetRef,
    catalog: unknown,
    flushHandler: FlushHandler,
  ): Promise<void>;
  resolve(input: ResolveInput): Promise<void>;
  invalidate(): Promise<void>;
};

