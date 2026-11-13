'use client';

import { useEffect, useMemo } from 'react';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useActiveDatasetSnapshot } from '@terrafirmagreg-team/kit/hooks/use-dataset-snapshot';
import { useRecipeIndex } from '@terrafirmagreg-team/recipe/hooks/use-index';
import { useRecipeQuery } from '@terrafirmagreg-team/recipe/hooks/use-query';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import {
  clientDumpLangNames,
  clientDumpLangRecipe,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { useRecipeIndexNames } from '@terrafirmagreg-team/recipe/lib/client-index/store';
import {
  RECIPE_ALL_TYPE,
  recipeHref,
  recipePlaceOpts,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeUsedItems } from '@terrafirmagreg-team/recipe/lib/browser/used-items';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type {
  RecipeHrefOpts,
  RecipePageData,
  RecipeSession,
} from '@terrafirmagreg-team/recipe/types';

let langMapMemo:
  | {
      names: Record<string, Record<string, string>>;
      langRaw: Record<string, string> | undefined;
      lang: string;
      map: Record<string, string>;
    }
  | undefined;

function mergeLangMap(
  names: Record<string, Record<string, string>>,
  langRaw: Record<string, string> | undefined,
  lang: string,
): Record<string, string> {
  if (
    langMapMemo?.names === names &&
    langMapMemo.langRaw === langRaw &&
    langMapMemo.lang === lang
  ) {
    return langMapMemo.map;
  }
  const map = { ...names.en_us, ...langRaw, ...names[lang] };
  langMapMemo = { names, langRaw, lang, map };
  return map;
}

export function useRecipeSession(page: RecipePageData): RecipeSession {
  const { dataset: id, lang } = page;
  const selection = useVersionedDataset(id.id, { versions: page.versions });
  const active = useActiveDatasetSnapshot(selection);
  const snapshot = id.revision ? id : active ?? selection ?? id;
  const dataset = useMemo(
    () => ({ ...snapshot, pin: selection?.version }),
    [snapshot, selection?.version],
  );
  const query = useRecipeQuery(dataset, selection?.version);
  const { index, indexLoading } = useRecipeIndex(dataset, lang);
  const placeOpts = recipePlaceOpts(query.place);

  const indexNames = useRecipeIndexNames(dataset);
  const names = useMemo(
    () => indexNames ?? index?.names ?? {},
    [indexNames, index],
  );
  const langRaw = useAsyncValue(
    () =>
      Promise.all([
        clientDumpLangNames(dataset, lang),
        clientDumpLangRecipe(dataset, lang),
      ]).then(([names, recipe]) => ({ ...names, ...recipe })),
    [dataset, lang],
  );
  const langMap = useMemo(
    () => mergeLangMap(names, langRaw, lang),
    [langRaw, names, lang],
  );
  const used = useMemo(() => recipeUsedItems(index), [index]);
  const { type: navType, tool: navTool } = placeOpts;
  const nav = useMemo<RecipeHrefOpts>(
    () => ({
      ...(navType ? { type: navType } : {}),
      ...(navTool ? { tool: navTool } : {}),
      tab: query.tab,
      item: query.item,
      fluid: query.fluid,
      id: query.recipeId,
      relation: query.relation,
      search: query.query || undefined,
      rpage: query.rpage + 1,
      version: selection?.version,
    }),
    [
      navType,
      navTool,
      query.tab,
      query.item,
      query.fluid,
      query.recipeId,
      query.relation,
      query.query,
      query.rpage,
      selection?.version,
    ],
  );

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
  const resolved = useResolvedLang();
  useEffect(() => {
    if (!bareIndex || !firstType) return;
    replaceUrlState(
      recipeHref(dataset, resolved, { ...nav, type: firstType }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nav tracks URL state; effect must run only on bare-index transitions
  }, [bareIndex, firstType, dataset, resolved]);

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
