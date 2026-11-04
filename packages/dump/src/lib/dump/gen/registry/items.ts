export interface RegistryItems {
  [k: string]: ItemEntry | undefined;
}
export interface ItemEntry {
  block?: string | null;
  display: Display;
  id: string;
  maxCount?: number | null;
  order?: number | null;
  producedBy?: string[];
  rarity?: string | null;
  sprite?: null | SpriteEntry;
  tags?: string[];
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
export interface VariantEntry {
  display?: null | Display;
  model?: string | null;
  sprite?: null | SpriteEntry;
  tag?: null | JsonNode;
  texture?: string | null;
}
export interface JsonNode {
  [k: string]: unknown | undefined;
}

