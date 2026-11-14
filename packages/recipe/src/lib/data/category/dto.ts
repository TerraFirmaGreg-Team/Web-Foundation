import type { DumpDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type {
  RecipeCategory,
  RecipeCategoryLayout,
  RecipeLayoutSlot,
} from '@terrafirmagreg-team/dump/lib/dump/gen';

export type DumpLayoutSlot = RecipeLayoutSlot;

export type DumpRecipeLayout = Omit<RecipeCategoryLayout, 'slots'> & {
  slots: DumpLayoutSlot[];
  workstations?: TaggedReference[];
};

export type DumpRecipeCategory = Omit<
  RecipeCategory,
  'display' | 'icon' | 'layout' | 'workstations'
> & {
  id: string;
  display?: DumpDisplay;
  icon?: TaggedReference;
  workstations?: TaggedReference[];
  layout?: DumpRecipeLayout;
};

