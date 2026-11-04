'use client';

import { useEffect, useMemo } from 'react';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useRecipeIndex } from '@terrafirmagreg-team/recipe/hooks/use-index';
import { useRecipeQuery } from '@terrafirmagreg-team/recipe/hooks/use-query';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { useRecipeIndexNames } from '@terrafirmagreg-team/recipe/lib/index-store';
import {
  RECIPE_ALL_TYPE,
  recipeHref,
  recipePlaceOpts,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeUsedItems } from '@terrafirmagreg-team/recipe/lib/used-items';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type {
  RecipeHrefOpts,
  RecipePageData,
  RecipeSession,
} from '@terrafirmagreg-team/recipe/types';

export function useRecipeSession(page: RecipePageData): RecipeSession {
  const { dataset: id, lang } = page;
  const dataset =
    useVersionedDataset(id.id, { versions: page.versions }) ?? id;
  const query = useRecipeQuery(dataset, lang);
  const { index, indexLoading } = useRecipeIndex(dataset, lang);
  const placeOpts = recipePlaceOpts(query.place);

  const indexNames = useRecipeIndexNames(dataset);
  const names = useMemo(
    () => indexNames ?? index?.names ?? {},
    [indexNames, index],
  );
  const langRaw = useAsyncValue(
    () => clientDumpLang(dataset, lang),
    [dataset, lang],
  );
  const langMap = useMemo(
    () => ({ ...names.en_us, ...langRaw, ...names[lang] }),
    [langRaw, names, lang],
  );
  const used = useMemo(() => recipeUsedItems(index), [index]);
  const nav: RecipeHrefOpts = {
    ...placeOpts,
    tab: query.tab,
    item: query.item,
    fluid: query.fluid,
    id: query.recipeId,
    relation: query.relation,
    search: query.query || undefined,
    rpage: query.rpage + 1,
  };

  const firstType = useMemo(() => {
    const counts = index?.typeCounts;
    if (!counts) return undefined;
    return index?.categories
      ?.map((row) => row.id)
      .find((id) => (counts[id] ?? 0) > 0);
  }, [index]);
  const bareIndex =
    query.place.kind === 'type' &&
    query.place.id === RECIPE_ALL_TYPE &&
    !query.item &&
    !query.fluid;
  useEffect(() => {
    if (!bareIndex || !firstType) return;
    replaceUrlState(recipeHref(dataset, lang, { ...nav, type: firstType }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nav rebuilds per render
  }, [bareIndex, firstType, dataset, lang]);

  return {
    page,
    dataset,
    lang,
    ...query,
    placeOpts,
    nav,
    index,
    indexLoading,
    names,
    langMap,
    used,
  };
}

