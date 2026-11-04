import type { DumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';

export type GuideBookRef = {
  modId: string;
  bookPath: string;
  bookId: string;
  dir: string;
};

export type DumpMod = {
  namespace: string;
  keybindsFile: string | null;
  items: string | null;
  blocks: string | null;
  fluids: string | null;
  entities: string | null;
  tabs: string | null;
  groups: string | null;
  recipeCategories: string | null;
  tags: string | null;
  recipeIndex: string | null;
  questData: string | null;
  books: GuideBookRef[];
};

export type DumpIndex = {
  root: string;
  manifest: DumpManifest;
  mods: DumpMod[];
};

