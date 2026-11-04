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

export interface RegistryTabs {
  [k: string]: TabEntry | undefined;
}
export interface TabEntry {
  display: Display;
  icon?: null | TaggedReference;
  id: string;
  items: TaggedReference[];
  order: number;
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

