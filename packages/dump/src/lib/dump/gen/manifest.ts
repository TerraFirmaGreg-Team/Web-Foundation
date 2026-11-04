export interface Manifest {
  indexes: DumpIndexes;
  languages: string[];
  layout: string;
  namespaces: {
    [k: string]: NamespaceDisplay | undefined;
  };
  pack?: null | PackInfo;
  producer: DumpProducer;
  schema: "manifest";
}
export interface DumpIndexes {
  quests: {
    [k: string]: string | undefined;
  };
  recipes: RecipeTypesIndex;
  used: string[];
}
export interface RecipeTypesIndex {
  types: RecipeTypeRow[];
}
export interface RecipeTypeRow {
  count: number;
  files: {
    [k: string]: string | undefined;
  };
  id: string;
}
export interface NamespaceDisplay {
  display: Display;
  guides: string[];
  keybinds: boolean;
  languages: string[];
  quests: boolean;
  registry: string[];
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
export interface PackInfo {
  id: string;
  version?: string | null;
}
export interface DumpProducer {
  minecraft: string;
  name: string;
  platform: string;
}

