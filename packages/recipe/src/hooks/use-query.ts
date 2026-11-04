'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useEffect, useState } from 'react';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import {
  recipeCalcHref,
  recipeHref,
  recipePlaceFromParams,
} from '@terrafirmagreg-team/recipe/lib/links';
import { canonicalStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { RecipeRelation } from '@terrafirmagreg-team/recipe/types';

function urlPage(params: URLSearchParams, key: string) {
  const raw = Number.parseInt(params.get(key) || '1', 10);
  return Number.isFinite(raw) && raw > 0 ? raw - 1 : 0;
}

function urlRelation(
  params: URLSearchParams,
): RecipeRelation | undefined {
  const value = params.get('relation');
  return value === 'uses' || value === 'tags' ? value : undefined;
}

export function useRecipeQuery(dataset: DatasetRef, lang: Lang) {
  const params = useLocationSearchParams();

  const place = recipePlaceFromParams(params);
  const isCalc = place.kind === 'calc';
  const isTool = place.kind !== 'type';
  const rawItem = params.get('item') ?? undefined;
  const rawFluid = params.get('fluid') ?? undefined;
  const item = isTool ? undefined : rawItem;
  const fluid = isTool || item ? undefined : rawFluid;
  const recipeId = isCalc ? undefined : (params.get('id') ?? undefined);
  const solo = isTool || !recipeId ? undefined : (params.get('solo') ?? undefined);
  const relation = isTool ? undefined : urlRelation(params);
  const tab = params.get('tab') ?? undefined;
  const tree = isCalc ? (params.get('tree') ?? '') : undefined;
  const isAlloy = place.kind === 'alloy';
  const alloyUnit =
    isAlloy && params.get('unit') === 'ingot' ? ('ingot' as const) : undefined;
  const alloyMix = isAlloy ? (params.get('mix') ?? undefined) : undefined;
  const searchParam = isTool ? '' : (params.get('search') ?? '');
  const rpageValue = isTool ? 0 : urlPage(params, 'rpage');

  const [query, setQuery] = useState(searchParam);
  const [lastSearch, setLastSearch] = useState(searchParam);
  if (lastSearch !== searchParam) {
    setLastSearch(searchParam);
    setQuery(searchParam);
  }

  useEffect(() => {
    if (!isTool) return;
    const stray = isCalc
      ? params.get('type') ||
        params.get('item') ||
        params.get('fluid') ||
        params.get('id') ||
        params.get('solo') ||
        params.get('relation') ||
        params.get('search') ||
        params.get('rpage') ||
        params.get('unit') ||
        params.get('mix')
      : params.get('type') ||
        params.get('item') ||
        params.get('fluid') ||
        params.get('relation') ||
        params.get('search') ||
        params.get('rpage') ||
        params.get('solo') ||
        params.get('tree') ||
        (isAlloy ? null : params.get('unit') || params.get('mix'));
    if (!stray) return;
    replaceUrlState(
      isCalc
        ? recipeCalcHref(dataset, lang, tree || undefined)
        : recipeHref(dataset, lang, {
            tool: place.kind,
            id: recipeId,
            unit: alloyUnit,
            mix: alloyMix,
            tab,
          }),
    );
  }, [
    isTool,
    isCalc,
    place.kind,
    lang,
    dataset,
    params,
    tree,
    recipeId,
    tab,
    isAlloy,
    alloyUnit,
    alloyMix,
  ]);

  useEffect(() => {
    if (isTool) return;
    if (rawItem && rawFluid) {
      replaceUrlState(
        recipeHref(dataset, lang, {
          type: params.get('type') ?? undefined,
          item: rawItem,
          id: recipeId,
          solo,
          relation,
          tab,
          search: searchParam || undefined,
          rpage: rpageValue + 1,
        }),
      );
    }
  }, [
    isTool,
    lang,
    dataset,
    params,
    rawItem,
    rawFluid,
    recipeId,
    solo,
    relation,
    tab,
    searchParam,
    rpageValue,
  ]);

  useEffect(() => {
    if (isTool || (rawItem && rawFluid)) return;
    const canonItem = rawItem ? canonicalStackId(rawItem) : undefined;
    const canonFluid = rawFluid ? canonicalStackId(rawFluid) : undefined;
    if (canonItem === rawItem && canonFluid === rawFluid) return;
    replaceUrlState(
      recipeHref(dataset, lang, {
        type: params.get('type') ?? undefined,
        item: canonItem,
        fluid: canonFluid,
        id: recipeId,
        solo,
        relation,
        tab,
        search: searchParam || undefined,
        rpage: rpageValue + 1,
      }),
    );
  }, [
    isTool,
    lang,
    dataset,
    params,
    rawItem,
    rawFluid,
    recipeId,
    solo,
    relation,
    tab,
    searchParam,
    rpageValue,
  ]);

  return {
    place,
    item,
    fluid,
    recipeId,
    alloyUnit,
    alloyMix,
    solo,
    relation,
    tab,
    tree,
    query,
    setQuery,
    rpage: rpageValue,
  };
}

