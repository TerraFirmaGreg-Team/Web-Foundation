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

export interface RegistryBlocks {
  [k: string]: BlockEntry | undefined;
}
export interface BlockEntry {
  display: Display;
  id: string;
  item?: null | TaggedReference;
  order?: number | null;
  producedBy?: string[];
  sprite?: null | SpriteEntry;
  tags?: string[];
  usedBy?: string[];
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
export interface SpriteEntry {
  h: number;
  image: string;
  ph: number;
  pw: number;
  tint?: string | null;
  tintColor?: string | null;
  w: number;
  x: number;
  y: number;
}

