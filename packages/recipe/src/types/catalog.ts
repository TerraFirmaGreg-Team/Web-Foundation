import type { DumpCreativeTab } from '@terrafirmagreg-team/dump/lib/dump/data/tab/dto';
import type { RecipeCategory } from './index';

export type PreparedCatalog = {
  items: string[];
  fluids: string[];
  usedIds: string[];
  tabs: DumpCreativeTab[];
  tabItems: Record<string, string[]>;
  categories: RecipeCategory[];
  groups: { id: string; members: string[] }[];
};

export type CatalogLabels = {
  mods: Record<string, string>;
  names: Record<string, string>;
  groups: Record<string, string>;
};
