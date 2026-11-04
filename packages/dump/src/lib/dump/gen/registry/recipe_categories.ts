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

export interface RegistryRecipeCategories {
  [k: string]: RecipeCategory | undefined;
}
export interface RecipeCategory {
  display: Display;
  icon?: null | TaggedReference;
  layout?: null | RecipeCategoryLayout;
  order: number;
  workstations?: TaggedReference[];
}
export interface Display {
  name: string;
  tooltip: DumpText[];
  tooltipMods: {
    [k: string]: DumpText[] | undefined;
  };
}
export interface DumpText {
  extra?: DumpText[];
  keybind?: string;
  text?: string;
  translate?: string;
  with?: DumpText[];
}
export interface TaggedReference {
  id: ResourceId;
  kind: ReferenceKind;
  tag?: JsonNode;
}
export interface JsonNode {
  [k: string]: unknown | undefined;
}
export interface RecipeCategoryLayout {
  h: number;
  image?: string;
  margin?: number;
  scale?: number;
  slots: {
    [k: string]: RecipeLayoutSlot | undefined;
  };
  w: number;
}
export interface RecipeLayoutSlot {
  h: number;
  id: string;
  role: string;
  w: number;
  x: number;
  y: number;
}

