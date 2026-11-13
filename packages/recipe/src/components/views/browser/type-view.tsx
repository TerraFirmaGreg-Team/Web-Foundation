'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { RecipeFrame } from '@terrafirmagreg-team/recipe/components/views/browser/frame';
import {
  RecipeCardGrid,
  recipeCardDim,
} from '@terrafirmagreg-team/recipe/components/views/browser/card-grid';
import { PlaceHeader } from '@terrafirmagreg-team/recipe/components/views/browser/place-header';
import { useCategoriesById } from '@terrafirmagreg-team/recipe/hooks/use-categories-by-id';
import { useFitPages } from '@terrafirmagreg-team/ui/hooks/page/use-fit-pages';
import {
  loadTypeRows,
  nonEmptyCategoryIds,
  resolveRecipeRows,
} from '@terrafirmagreg-team/recipe/lib/client-index';
import { RECIPE_ALL_TYPE, recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { RecipeTypeTabs } from '@terrafirmagreg-team/recipe/components/views/browser/type-tabs';
import { WorkstationRail } from '@terrafirmagreg-team/recipe/components/views/browser/workstation-rail';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type {
  RecipeCompactRow,
  RecipeSession,
} from '@terrafirmagreg-team/recipe/types';

const EMPTY_ROWS: RecipeCompactRow[] = [];

export function TypeView({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const {
    dataset,
    index,
    indexLoading,
    place,
    nav,
    recipeId,
    rpage,
  } = session;
  const boxRef = useRef<HTMLDivElement | null>(null);

  const placeId = place?.kind === 'type' ? place.id : RECIPE_ALL_TYPE;

  const categoriesById = useCategoriesById(index);
  const nonEmptyIds = nonEmptyCategoryIds(index);

  const shown =
    placeId !== RECIPE_ALL_TYPE && nonEmptyIds.includes(placeId)
      ? placeId
      : nonEmptyIds[0];
  const rowsRes = useAsyncResult(
    () =>
      index && shown
        ? loadTypeRows(dataset, index, shown)
        : Promise.resolve(EMPTY_ROWS),
    [dataset, index, shown],
  );
  const rows = rowsRes.error ? EMPTY_ROWS : rowsRes.value;

  const allRows = rows ?? EMPTY_ROWS;
  const focusIndex = recipeId
    ? allRows.findIndex((row) => row.id === recipeId)
    : -1;
  const focusRes = useAsyncResult(
    () =>
      recipeId && index && rows !== undefined && focusIndex < 0
        ? resolveRecipeRows(dataset, index, [recipeId])
        : Promise.resolve(undefined),
    [dataset, index, recipeId, rows, focusIndex],
  );
  const solo = recipeId != null && session.solo === '1';
  const feedRows = solo
    ? focusIndex >= 0
      ? [allRows[focusIndex]]
      : (focusRes.value ?? EMPTY_ROWS)
    : allRows;
  const feedFocus = solo && focusIndex >= 0 ? 0 : focusIndex;
  useEffect(() => {
    if (!recipeId || !index || rows === undefined || focusIndex >= 0) return;
    if (focusRes.pending) return;
    const row = focusRes.value?.[0];
    const category = row ? index.types[row.type] : undefined;
    replaceUrlState(
      recipeHref(dataset, resolved, {
        ...nav,
        ...(category && category !== shown ? { type: category } : {}),
        ...(category ? {} : { id: undefined }),
        rpage: undefined,
      }),
    );
  }, [focusIndex, focusRes.pending, focusRes.value, index, nav, dataset, resolved, recipeId, rows, shown]);
  const list = useFitPages(
    boxRef,
    feedRows,
    (row, box) => {
      const d = recipeCardDim(index, categoriesById, row);
      return d.h > box.h ? { w: d.w, h: box.h } : d;
    },
    rpage,
    8,
    feedFocus >= 0 ? feedFocus : undefined,
    true,
  );

  const onSwipe = (dir: -1 | 1) => {
    if (recipeId) {
      const next = focusIndex + dir;
      const row = allRows[next];
      if (focusIndex < 0 || !row) return;
      replaceUrlState(
        recipeHref(dataset, resolved, { ...nav, id: row.id, rpage: undefined }),
      );
      return;
    }
    if (list.pages <= 1) return;
    replaceUrlState(
      recipeHref(dataset, resolved, {
        ...nav,
        rpage: (list.page + dir + list.pages) % list.pages,
      }),
    );
  };

  const body = !indexLoading && (!index || !index.types.length) ? (
    <RecipeCardGrid
      session={session}
      rows={EMPTY_ROWS}
      boxRef={boxRef}
      empty={t('No recipe dump for this dataset. Run export to generate data.', { note: 'recipe.no_dump' })}
    />
  ) : (
    <RecipeCardGrid
      session={session}
      rows={list.shown}
      boxRef={boxRef}
      maxH={list.box.h}
      maxW={list.box.w}
      loading={indexLoading || (shown != null && rows === undefined)}
      empty={t('No recipes of this type.', { note: 'recipe.empty_type' })}
      onSwipe={onSwipe}
    />
  );

  return (
    <RecipeFrame
      session={session}
      list={list}
      strip={
        <RecipeTypeTabs
          session={session}
          ids={nonEmptyIds}
          value={shown}
          onChange={(id) => {
            if (id === shown) return;
            replaceUrlState(
              recipeHref(dataset, resolved, {
                ...nav,
                type: id,
                id: undefined,
                solo: undefined,
                rpage: undefined,
              }),
            );
          }}
        />
      }
      header={
        <PlaceHeader session={session} overline={t('Categories', { note: 'recipe.axis_type' })} />
      }
      rail={
        <WorkstationRail
          session={session}
          workstations={
            shown ? categoriesById.get(shown)?.workstations : undefined
          }
        />
      }
    >
      {body}
    </RecipeFrame>
  );
}

