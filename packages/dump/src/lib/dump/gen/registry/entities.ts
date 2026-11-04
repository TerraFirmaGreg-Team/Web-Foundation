export interface RegistryEntities {
  [k: string]: EntityEntry | undefined;
}
export interface EntityEntry {
  display: Display;
  id: string;
  model?: string | null;
  order?: number | null;
  producedBy?: string[];
  tags?: string[];
  texture?: string | null;
  usedBy?: string[];
  variants: VariantEntry[];
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
export interface VariantEntry {
  display?: null | Display;
  model?: string | null;
  sprite?: null | SpriteEntry;
  tag?: null | JsonNode;
  texture?: string | null;
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
export interface JsonNode {
  [k: string]: unknown | undefined;
}

