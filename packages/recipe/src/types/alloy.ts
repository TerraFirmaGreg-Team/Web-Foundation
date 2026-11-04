import type { Recipe, RecipeSlotFill } from '@terrafirmagreg-team/recipe/lib/data/dto';

export type AlloyComponent = {
  slot: RecipeSlotFill;
  range?: { min: number; max: number };
};

export type AlloyRecipe = {
  recipe: Recipe;
  components: AlloyComponent[];
};

export type AlloyMixRow = {
  slot: RecipeSlotFill;
  range?: { min: number; max: number };
  amount: number;
  percent: number;
  valid: boolean;
};

