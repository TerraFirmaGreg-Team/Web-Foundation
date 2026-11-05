'use client';

import { useEffect, useMemo } from 'react';
import { groupByCategory } from '@terrafirmagreg-team/recipe/lib/group';
import { TAG_RECIPE_TYPE } from '@terrafirmagreg-team/recipe/lib/client-index';
import { RECIPE_ALL_TYPE, recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type {
  RecipeCompactRow,
  RecipeSession,
} from '@terrafirmagreg-team/recipe/types';

export function useTypeFilter(
  session: Pick<
    RecipeSession,
    | 'dataset'
    | 'index'
    | 'nav'
    | 'place'
    | 'item'
    | 'fluid'
    | 'recipeId'
  >,
  rows: RecipeCompactRow[],
) {
  const { dataset, index, nav, place, recipeId } = session;
  const resolved = useResolvedLang();
  const groups = useMemo(
    () => groupByCategory(rows, index?.types ?? [], index?.categories),
    [rows, index],
  );

  const urlType =
    place?.kind === 'type' && place.id !== RECIPE_ALL_TYPE
      ? place.id
      : undefined;
  const valid = groups.some((group) => group.category === urlType)
    ? urlType
    : undefined;
  const primary =
    (recipeId
      ? groups.find((group) => group.rows.some((row) => row.id === recipeId))
          ?.category
      : undefined) ??
    groups.find((group) => group.category !== TAG_RECIPE_TYPE)?.category ??
    groups[0]?.category;
  const active = valid ?? primary ?? '';
  const activeRows =
    groups.find((group) => group.category === active)?.rows ?? [];

  useEffect(() => {
    if (!primary || valid) return;
    replaceUrlState(
      recipeHref(dataset, resolved, { ...nav, type: primary, rpage: undefined }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nav rebuilds per render
  }, [primary, valid, dataset, resolved]);

  const setActive = (next: string) => {
    if (next === active || next === urlType) return;
    replaceUrlState(
      recipeHref(dataset, resolved, { ...nav, type: next, rpage: undefined }),
    );
  };

  return {
    ids: groups.map((group) => group.category),
    active,
    setActive,
    rows: activeRows,
  };
}

