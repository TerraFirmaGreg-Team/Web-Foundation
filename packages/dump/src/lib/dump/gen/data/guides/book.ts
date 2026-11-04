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

export interface DataGuidesBook {
  categories: {
    [k: string]: string | undefined;
  };
  cover?: null | TaggedReference;
  display: GuideDisplay;
  entries: {
    [k: string]: string | undefined;
  };
  extensions?: {
    [k: string]: JsonNode | undefined;
  };
  i18n?: boolean;
  id?: string;
  macros?: {
    [k: string]: string | undefined;
  };
  model?: string;
  order: number;
  schema: "data/guides/book";
  slug?: string;
  subtitle?: string;
}
export interface TaggedReference {
  id: ResourceId;
  kind: ReferenceKind;
  tag?: JsonNode;
}
export interface JsonNode {
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

