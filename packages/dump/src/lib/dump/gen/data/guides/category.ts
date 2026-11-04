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

export interface DataGuidesCategory {
  description?: string;
  icon?: TaggedReference;
  name?: string;
  order: number;
  schema: "data/guides/category";
  [k: string]: unknown | undefined;
}
export interface TaggedReference {
  id: ResourceId;
  kind: ReferenceKind;
  tag?: JsonNode;
}
export interface JsonNode {
  [k: string]: unknown | undefined;
}

