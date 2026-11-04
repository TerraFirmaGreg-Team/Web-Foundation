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

export interface DataGuidesEntry {
  [k: string]: GuideEntry | undefined;
}
export interface GuideEntry {
  category?: string;
  display: GuideDisplay;
  icon?: TaggedReference;
  order?: number;
  pages: GuidePage[];
  [k: string]: unknown | undefined;
}
export interface GuideDisplay {
  landing: DumpText[];
  name: string;
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
export interface GuidePage {
  type?: string;
  [k: string]: unknown | undefined;
}

