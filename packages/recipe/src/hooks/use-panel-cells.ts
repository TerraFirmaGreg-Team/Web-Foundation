'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useDeferredValue, useMemo } from 'react';
import { useItemTooltips } from '@terrafirmagreg-team/recipe/hooks/use-item-tooltips';
import { useTagMembers } from '@terrafirmagreg-team/recipe/hooks/use-tag-members';
import { filterCatalogItemIds } from '@terrafirmagreg-team/recipe/lib/search/index';
import {
  buildPanelCells,
  panelPool,
  type ItemPanelMode,
} from '@terrafirmagreg-team/recipe/lib/browser/panel';
import {
  filterUsedIds,
  hasRecipeUsage,
  recipeUsedItems,
} from '@terrafirmagreg-team/recipe/lib/browser/used-items';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  FavoriteEntry,
  ItemPanelCell,
  RecipeCompactIndex,
  UsedItems,
} from '@terrafirmagreg-team/recipe/types';

const UNUSED: UsedItems = { ids: new Set(), bases: new Set() };

export function usePanelCells({
  dataset,
  index,
  names,
  lang,
  mode,
  query,
  tab,
  hideUnused,
  favorites,
  expandedGroups,
}: {
  dataset: DatasetRef;
  index: RecipeCompactIndex | null;
  names: Record<string, Record<string, string>>;
  lang: Lang;
  mode: ItemPanelMode;
  query: string;
  tab?: string;
  hideUnused: boolean;
  favorites: { entries: FavoriteEntry[] };
  expandedGroups: ReadonlySet<string>;
}) {
  const favoriteIds = useMemo(
    () =>
      favorites.entries.flatMap((entry) =>
        entry.kind === 'stack' ? [entry.id] : [],
      ),
    [favorites.entries],
  );

  const dIndex = useDeferredValue(index);
  const dNames = useDeferredValue(names);
  const dLang = useDeferredValue(lang);

  const pool = useMemo(
    () => panelPool(mode, favoriteIds, dIndex, tab),
    [dIndex, mode, favoriteIds, tab],
  );

  const used = useMemo(
    () =>
      mode === 'all' && hideUnused ? recipeUsedItems(dIndex) : UNUSED,
    [dIndex, mode, hideUnused],
  );
  const tooltips = useItemTooltips(dataset, dLang, query.includes('$'));
  const tagMembers = useTagMembers(dataset, query.includes('#'));
  const filtered = useMemo(() => {
    const base =
      mode === 'all' && hideUnused && hasRecipeUsage(used)
        ? filterUsedIds(pool, used)
        : pool;
    return filterCatalogItemIds(base, query, {
      names: dNames,
      lang: dLang,
      tagMembers,
      mods: dIndex?.mods,
      tooltips,
    });
  }, [pool, mode, hideUnused, used, query, dNames, dLang, dIndex, tooltips, tagMembers]);
  const deferredFiltered = useDeferredValue(filtered);
  const cells = useMemo(() => {
    if (mode === 'fav') {
      const shown = new Set(deferredFiltered);
      return favorites.entries.flatMap((entry): ItemPanelCell[] =>
        entry.kind === 'recipe'
          ? [
              {
                kind: 'recipe',
                fav: {
                  id: entry.id,
                  type: entry.type,
                  ...(entry.icon ? { icon: entry.icon } : {}),
                },
              },
            ]
          : shown.has(entry.id)
            ? [
                {
                  kind: 'stack',
                  id: entry.id,
                  ...(entry.ref ? { ref: entry.ref } : {}),
                },
              ]
            : [],
      );
    }
    return buildPanelCells(
      deferredFiltered,
      dIndex?.groups,
      expandedGroups,
    );
  }, [deferredFiltered, dIndex, mode, expandedGroups, favorites.entries]);

  return { cells, filtered: deferredFiltered, favoriteIds, dIndex, dNames, dLang };
}

