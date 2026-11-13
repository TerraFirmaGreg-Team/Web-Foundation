import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { DatasetLanding } from '@terrafirmagreg-team/kit/types';
import type { DumpCreativeTab } from '@terrafirmagreg-team/dump/lib/dump/data/tab/dto';
import type { DumpRecipeCategory } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';

export type { Recipe };

export type RecipeCategory = DumpRecipeCategory;

export type RecipeTool = 'calc' | 'forge' | 'alloy';

export type RecipePlace = { kind: 'type'; id: string } | { kind: RecipeTool };

export type RecipeRelation = 'uses' | 'tags';

export type RecipeHrefOpts = {
  item?: string;
  fluid?: string;
  id?: string;
  solo?: string;
  tab?: string;
  search?: string;
  rpage?: number;
  type?: string;
  relation?: RecipeRelation;
  tool?: RecipeTool;
  version?: string;

  unit?: 'mb' | 'ingot';

  mix?: string;
};

export type RecipeStackGroup = {
  id: string;
  name?: string;
  members: string[];
};

export type RecipeFavorite = { id: string; type: string; icon?: string };

export type FavoriteEntry =
  | { kind: 'stack'; id: string; ref?: 'item' | 'fluid' }
  | ({ kind: 'recipe' } & RecipeFavorite);

export type ItemPanelCell =
  | { kind: 'stack'; id: string; ref?: 'item' | 'fluid'; groupId?: string }
  | {
      kind: 'group';
      id: string;
      label: string;
      members: string[];
      expanded: boolean;
    }
  | { kind: 'recipe'; fav: RecipeFavorite };

export type RecipeCompactIndex = {
  types: string[];
  typeCounts?: Record<string, number>;
  items: string[];
  fluids?: string[];
  usedIds?: string[];
  groups?: RecipeStackGroup[];
  names: Record<string, Record<string, string>>;
  tabs?: DumpCreativeTab[];
  tabItems?: Record<string, string[]>;
  mods?: Record<string, string>;
  categories?: DumpRecipeCategory[];
};

export type RecipeCompactRow = {
  id: string;
  type: number;

  cat?: string;
  o?: number;
  in: string[];
  out: string[];
  bodyUrl?: string;
  image?: string;
  bucket?: string;
  d?: { w: number; h: number };
};

export type UsedItems = {
  ids: Set<string>;
  bases: Set<string>;
};

export type RecipeSidebarGroup = 'flat' | 'mod';

export type RecipePageData = DatasetLanding;

export type RecipeChrome = Pick<
  RecipeCompactIndex,
  | 'items'
  | 'fluids'
  | 'tabs'
  | 'tabItems'
  | 'categories'
  | 'names'
  | 'mods'
  | 'groups'
  | 'usedIds'
>;

export type CategoryGroup = { category: string; rows: RecipeCompactRow[] };

export type RecipeSession = {
  page: RecipePageData;
  dataset: DatasetRef;
  lang: Lang;
  place?: RecipePlace;
  placeOpts: Pick<RecipeHrefOpts, 'type' | 'tool'>;
  item?: string;
  fluid?: string;
  recipeId?: string;

  alloyUnit?: 'mb' | 'ingot';
  alloyMix?: string;
  solo?: string;
  relation?: RecipeRelation;
  tab?: string;
  tree?: string;
  query: string;
  setQuery: (query: string) => void;
  rpage: number;
  nav: RecipeHrefOpts;
  index: RecipeCompactIndex | null;
  indexLoading: boolean;
  names: Record<string, Record<string, string>>;
  langMap: Record<string, string>;
  used: UsedItems;
};

