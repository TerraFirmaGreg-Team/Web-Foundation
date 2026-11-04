import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';

export type ForgeRuleAction =
  | 'hit'
  | 'draw'
  | 'punch'
  | 'bend'
  | 'upset'
  | 'shrink';

export type ForgeRule = {
  action: ForgeRuleAction;
  order: 'last' | 'second_last' | 'third_last' | 'not_last' | 'any';
};

export type ForgeRecipe = {
  recipe: Recipe;
  rules: ForgeRule[];
  rulesSupported: boolean;
};

