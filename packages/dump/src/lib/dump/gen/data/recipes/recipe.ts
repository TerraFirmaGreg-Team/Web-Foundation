export type ResourceId = string;
export type ReferenceKind =
  | "item"
  | "block"
  | "fluid"
  | "entity"
  | "itemTag"
  | "blockTag"
  | "fluidTag"
  | "entityTag"
  | "texture"
  | "model"
  | "recipe";

export interface DataRecipesRecipe {
  [k: string]: RecipeEntry | undefined;
}
export interface RecipeEntry {
  category: string;
  h?: number;
  image?: string;
  order?: number;
  properties: {};
  slots: {
    [k: string]: RecipeSlot | undefined;
  };
  w?: number;
  widgets?: RecipeWidget[];
}
export interface RecipeSlot {
  alternatives?: TaggedReference[];
  amount?: number | null;
  chance?: number;
  h?: number;
  ref: TaggedReference;
  type: string;
  w?: number;
  x?: number;
  y?: number;
}
export interface TaggedReference {
  id: ResourceId;
  kind: ReferenceKind;
  tag?: JsonNode;
}
export interface JsonNode {
  [k: string]: unknown | undefined;
}
export interface RecipeWidget {
  color?: number | null;
  component?: null | DumpText;
  endToStart?: boolean | null;
  fullToEmpty?: boolean | null;
  h: number;
  horizontal?: boolean | null;
  regionH?: number | null;
  regionW?: number | null;
  shadow?: boolean | null;
  text?: string | null;
  texture?: string | null;
  textureH?: number | null;
  textureW?: number | null;
  time?: number | null;
  tooltip?: string[] | null;
  type: string;
  u?: number | null;
  v?: number | null;
  w: number;
  x: number;
  y: number;
}
export interface DumpText {
  extra?: DumpText[];
  keybind?: string;
  text?: string;
  translate?: string;
  with?: DumpText[];
}

