'use client';
import type * as PageTree from 'fumadocs-core/page-tree';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLastValue } from '@terrafirmagreg-team/ui/hooks/use-last-value';
import { skeletonTree } from '@terrafirmagreg-team/ui/lib/tree';
import { useRecipeModNames } from '@terrafirmagreg-team/recipe/hooks/use-mod-names';
import { useSidebarGroup } from '@terrafirmagreg-team/recipe/hooks/use-sidebar-group';
import { groupRecipeSidebarByMod } from '@terrafirmagreg-team/recipe/lib/browser/sidebar';

export function useRecipeLeftSidebarTree(
  tree: PageTree.Root,
  dataset?: DatasetRef,
): PageTree.Root {
  const lang = useResolvedLang();
  const { sidebarGroup } = useSidebarGroup();
  const result = useRecipeModNames(
    sidebarGroup === 'mod' ? dataset : undefined,
    lang,
  );
  const modNames = useLastValue(result.value, dataset?.id ?? '');
  if (sidebarGroup === 'mod' && !modNames && result.pending)
    return skeletonTree('recipe:skeleton');
  return sidebarGroup === 'mod' && modNames
    ? groupRecipeSidebarByMod(tree, modNames)
    : tree;
}
