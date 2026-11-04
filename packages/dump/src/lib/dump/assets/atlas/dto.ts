import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { DumpNbt, TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export type AtlasPage = {
  image: string;
  w: number;
  h: number;
};

export type AtlasTint = 'none' | 'grass' | 'foliage' | 'water' | 'custom';

export type AtlasSprite = {
  ref: TaggedReference;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  tint?: AtlasTint;
  tintColor?: string;
  langKey?: string;
};

export type AtlasKind = 'item' | 'block';

export type IconAtlas = {
  sprites: AtlasSprite[];
  pages: AtlasPage[];
  modId: string;
  dataset: DatasetRef;
  kind: AtlasKind;
};

export type AtlasBundle = {
  items: IconAtlas | null;
  blocks: IconAtlas | null;
};

export type SpriteQuery = {
  kind?: 'item' | 'block' | 'fluid';
  id: string;
  tag?: DumpNbt;
};

export type AtlasLookup = {
  atlas: IconAtlas;
  sprite: AtlasSprite;
  page: AtlasPage;
  spriteId: string;
};

