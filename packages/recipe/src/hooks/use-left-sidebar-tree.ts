'use client';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLastValue } from '@terrafirmagreg-team/ui/hooks/use-last-value';
import { useRecipeModNames } from '@terrafirmagreg-team/recipe/hooks/use-mod-names';
import { useSidebarGroup } from '@terrafirmagreg-team/recipe/hooks/use-sidebar-group';
import { groupRecipeSidebarByMod } from '@terrafirmagreg-team/recipe/lib/sidebar';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';

export function useRecipeLeftSidebarTree(tree: PageTree.Root): PageTree.Root {
  const { dataset: datasetId } = parseSectionLocation(usePathname());
  const lang = useResolvedLang();
  const { sidebarGroup } = useSidebarGroup();
  const scopeKey = datasetId ?? '';
  const version = useLocationSearchParams().get('version') ?? undefined;
  const dataset = useMemo(
    () => (datasetId ? { id: datasetId, version } : undefined),
    [datasetId, version],
  );
  const modNames = useLastValue(
    useRecipeModNames(
      sidebarGroup === 'mod' ? dataset : undefined,
      lang,
    ),
    scopeKey,
  );
  return sidebarGroup === 'mod' && modNames
    ? groupRecipeSidebarByMod(tree, modNames)
    : tree;
}

