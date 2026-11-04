import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { RecipeEntry, RecipeSlot } from '@terrafirmagreg-team/dump/lib/dump/gen';

export const RECIPE_SLOT_TYPES = [
  'input',
  'output',
  'catalyst',
  'tank',
  'renderOnly',
] as const;

export type RecipeSlotType = (typeof RECIPE_SLOT_TYPES)[number];

export type IngredientKind = 'item' | 'fluid' | 'tag';

export type RecipeIngredient = {
  kind: IngredientKind;
  id: string;
  count?: number;
  chance?: number;
  x?: number;
  y?: number;
};

export type RecipeSlotFill = Omit<
  RecipeSlot,
  'amount' | 'ref' | 'type' | 'alternatives'
> & {
  type: RecipeSlotType;
  ref: TaggedReference;
  amount: number;
  kind: IngredientKind;
  id: string;
  count?: number;
  alternatives?: TaggedReference[];
};

export type RecipeSlotWidget = {
  type: 'slot';
  x: number;
  y: number;
  w: number;
  h: number;
  role: string;
  kind: IngredientKind;

  tagKind?: string;
  id: string;

  count?: number;

  chance?: number;

  alternatives?: string[];
};

export type RecipeTextWidget = {
  type: 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;

  component?: DumpText;

  color?: number;

  shadow?: boolean;
  tooltip?: string[];
};

export type RecipeGrid = {

  y: number;

  row: number;

  tail: number;
  cols: number;

  rows: number;
};

export type RecipeGridMember = {
  id: string;
  kind?: string;
  amount?: number;
  chance?: number;
};

export type RecipeTextureWidget = {
  type: 'texture' | 'animated';
  x: number;
  y: number;
  w: number;
  h: number;
  texture: string;
  u?: number;
  v?: number;
  regionW?: number;
  regionH?: number;
  time?: number;
  horizontal?: boolean;
  endToStart?: boolean;
  fullToEmpty?: boolean;
  textureW?: number;
  textureH?: number;
  tooltip?: string[];
};

export type RecipeDecorWidget = {
  type: 'widget';
  x: number;
  y: number;
  w: number;
  h: number;
  tooltip?: string[];
};

export type RecipeWidget =
  | RecipeSlotWidget
  | RecipeTextWidget
  | RecipeTextureWidget
  | RecipeDecorWidget;

export type Recipe = Omit<
  RecipeEntry,
  'image' | 'w' | 'h' | 'properties' | 'slots'
> & {
  id: string;
  type: string;
  modId: string;
  slots: Record<string, RecipeSlotFill>;
  properties: Record<string, unknown>;
  inputs: RecipeIngredient[];
  outputs: RecipeIngredient[];
  pattern?: string[];
  width?: number;
  height?: number;
  scale?: number;
  margin?: number;
  widgets: RecipeWidget[];
  bodyUrl: string;

  image?: string;
  w?: number;
  h?: number;
  extra: Record<string, unknown>;
};

