import type { RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';

export type CalcKind = 'item' | 'fluid';

export type TagResolution = { members: string[]; kind: CalcKind };

export type CalcMaterial = {
  id: string;
  kind: CalcKind;
  amount: number;

  chance?: number;
};

export type CalcRecipeInput = CalcMaterial & {
  catalyst: boolean;
  tagId?: string;
};

export type CalcRecipe = {
  recipeId: string;
  category: string;
  inputs: CalcRecipeInput[];
  outputs: CalcMaterial[];

  tier?: number;
};

export type CalcRecipeSummary = {
  recipeId: string;
  category: string;
  outputAmount: number;
  row: RecipeCompactRow;
};

export type CalcCard = {
  id: string;
  materialId: string;
  kind: CalcKind;
  recipeId: string | null;
  crafts: number;
  pos?: { x: number; y: number };
};

export type CalcWire = {
  from: string;
  to: string;
  input: number;
  out?: number;
  amount?: number;
};

export type CalculatorState = {
  cards: CalcCard[];
  wires: CalcWire[];
  tagSelections: Record<string, string>;
};

export type CalcNodeInput = {
  id?: string;
  kind: CalcKind;
  amount: number;
  catalyst: boolean;
  tagId?: string;
  wired: boolean;
  covered: number;
};

export type CalcOutput = CalcMaterial & {
  allocated: number;
  remaining: number;
};

export type CalcNode = {
  id: string;
  materialId: string;
  kind: CalcKind;
  crafts: number;
  produced: number;
  allocated: number;
  remaining: number;
  outputs: CalcOutput[];
  recipe: CalcRecipe | null;
  inputs: CalcNodeInput[];
  availableRecipes: CalcRecipeSummary[];
  cycle: boolean;
  products: boolean;
  tagId?: string;
  members?: string[];
  loading?: boolean;
};

