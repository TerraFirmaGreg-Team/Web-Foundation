import {
  createStoredValue,
  literalCodec,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';
import type { RecipeSidebarGroup } from '@terrafirmagreg-team/recipe/types';

const useStoredSidebarGroup = createStoredValue(
  'wiki.recipe.sidebarGroup',
  literalCodec<RecipeSidebarGroup>(['flat', 'mod'], 'mod'),
);

export function useSidebarGroup() {
  const [sidebarGroup, setSidebarGroup] = useStoredSidebarGroup();
  return { sidebarGroup, setSidebarGroup };
}

