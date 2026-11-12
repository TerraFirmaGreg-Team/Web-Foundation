'use client';

import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { PagedCard } from '@terrafirmagreg-team/recipe/components/cards/paged-card';
import { RecipeDefaultMenuItem } from '@terrafirmagreg-team/recipe/components/cards/default-item';
import { CopyIdMenu } from '@terrafirmagreg-team/game/components/entry/copy-id-menu';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import {
  recipeCardImageUrl,
  recipeHref,
  recipeImageUrl,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { loadClientRecipe } from '@terrafirmagreg-team/recipe/lib/client/recipe';
import { pushUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { useSwipe } from '@terrafirmagreg-team/ui/hooks/use-swipe';
import { favoriteHover } from '@terrafirmagreg-team/recipe/lib/browser/favorite-hover';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { FitDim } from '@terrafirmagreg-team/ui/hooks/page/use-fit-pages';
import type {
  RecipeCategory,
  RecipeCompactIndex,
  RecipeCompactRow,
  RecipeSession,
} from '@terrafirmagreg-team/recipe/types';

const FALLBACK_DIM: FitDim = { w: 320, h: 80 };

export function recipeCardDim(
  index: RecipeCompactIndex | null,
  categoriesById: Map<string, RecipeCategory>,
  row: RecipeCompactRow,
): FitDim {
  if (row.d) return { w: row.d.w, h: row.d.h };
  const typeId = index?.types[row.type];
  const layout = typeId ? categoriesById.get(typeId)?.layout : undefined;
  if (!layout) return FALLBACK_DIM;
  const scale = layout.scale ?? 2;
  const margin = layout.margin ?? 0;
  return {
    w: (layout.w + margin * 2) * scale,
    h: (layout.h + margin * 2) * scale,
  };
}

function RecipeGridCard({
  row,
  session,
  focused,
  maxH,
  maxW,
  onPick,
  menuExtra,
  defaultMaterial,
}: {
  row: RecipeCompactRow;
  session: RecipeSession;
  focused: boolean;
  maxH?: number;
  maxW?: number;
  onPick?: (recipeId: string) => void;
  menuExtra?: (row: RecipeCompactRow) => ReactNode;
  defaultMaterial?: string;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const { dataset, lang, langMap, names, nav, index } = session;
  const recipe = useAsyncValue(
    () => loadClientRecipe(dataset, row.id, row.bucket),
    [dataset, row.id, row.bucket],
  );
  const [failed, setFailed] = useState(false);

  const title = recipe
    ? recipeTitle(recipe, langMap)
    : recipeItemName(names, lang, row.out[0] ?? row.id);
  const src =
    (recipe ? recipeImageUrl(dataset, recipe) : undefined) ??
    (row.image
      ? recipeImageUrl(dataset, {
          modId: row.id.split(':', 1)[0],
          image: row.image,
        })
      : undefined) ??
    recipeCardImageUrl(dataset, row.id);

  const focus = () =>
    pushUrlState(
      recipeHref(dataset, resolved, { ...nav, id: row.id, solo: undefined }),
    );

  const isolate = () =>
    pushUrlState(
      recipeHref(dataset, resolved, { ...nav, id: row.id, solo: '1' }),
    );

  const openNewTab = () =>
    window.open(
      recipeHref(dataset, resolved, { ...nav, id: row.id, solo: '1' }),
      '_blank',
      'noopener',
    );

  const recipeType = index?.types[row.type];
  const cardW = recipe?.w ?? row.d?.w ?? 0;
  const fit = maxW && cardW > maxW ? maxW / cardW : 1;
  return (
    <CopyIdMenu
      id={row.id}
      label={t('Copy recipe id', { note: 'recipe.copy_recipe_id' })}
      extra={
        <>
          <RecipeDefaultMenuItem
            dataset={dataset}
            materialId={defaultMaterial ?? row.out[0]}
            recipeId={row.id}
          />
          {menuExtra?.(row)}
        </>
      }
    >
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a,button')) return;
          if (onPick) onPick(row.id);
          else focus();
        }}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest('a,button')) return;
          if (onPick) openNewTab();
          else isolate();
        }}
        onMouseEnter={() => {
          favoriteHover.base = recipeType
            ? {
                kind: 'recipe',
                id: row.id,
                type: recipeType,
                ...(row.out[0] ?? row.in[0]
                  ? { icon: (row.out[0] ?? row.in[0])! }
                  : {}),
              }
            : undefined;
        }}
        onMouseLeave={() => {
          favoriteHover.base = undefined;
          favoriteHover.slot = undefined;
        }}
        aria-current={focused || undefined}
        className={cn(
          'relative w-fit flex-none rounded-md',
          focused && 'ring-2 ring-primary ring-offset-1',
        )}
        style={fit < 1 ? { zoom: fit } : undefined}
      >
        {recipe ? (
          src && !failed ? (
            <PagedCard
              recipe={recipe}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              nav={nav}
              title={title}
              src={src}
              naturalW={row.d?.w}
              naturalH={row.d?.h}
              maxH={maxH}
              interactive={focused}
              onFail={() => setFailed(true)}
            />
          ) : (
            <EmptyState variant="empty">{t('No recipe image in dump.', { note: 'recipe.no_image' })}</EmptyState>
          )
        ) : src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element -- dump asset
          <img
            src={src}
            alt={title}
            width={row.d?.w}
            height={row.d?.h}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="block rounded-sm"
          />
        ) : (
          <Skeleton
            className="rounded-sm"
            style={{
              width: row.d?.w ?? FALLBACK_DIM.w,
              height: row.d?.h ?? FALLBACK_DIM.h,
              maxWidth: '100%',
            }}
          />
        )}
      </div>
    </CopyIdMenu>
  );
}

export function RecipeCardGrid({
  session,
  rows,
  boxRef,
  maxH,
  maxW,
  loading,
  empty,
  onSwipe,
  onPick,
  cardMenuExtra,
  defaultMaterial,
}: {
  session: RecipeSession;
  rows: RecipeCompactRow[];
  boxRef: RefObject<HTMLDivElement | null>;
  maxH?: number;
  maxW?: number;
  loading?: boolean;
  empty?: string;
  onSwipe?: (dir: -1 | 1) => void;
  onPick?: (recipeId: string) => void;
  cardMenuExtra?: (row: RecipeCompactRow) => ReactNode;
  defaultMaterial?: string;
}) {
  const { recipeId } = session;
  const swipe = useSwipe((dir) => onSwipe?.(dir));
  const { dataset } = session;

  useEffect(() => {
    for (const row of rows) void loadClientRecipe(dataset, row.id, row.bucket);
  }, [dataset, rows]);

  let body;
  if (loading) {
    body = Array.from({ length: 6 }, (_, i) => (
      <Skeleton
        key={i}
        className="h-24 rounded-md"
        style={{ width: 220 + (i % 3) * 60 }}
      />
    ));
  } else if (!rows.length) {
    body = empty ? <EmptyState variant="empty">{empty}</EmptyState> : null;
  } else {
    body = rows.map((row) => (
      <RecipeGridCard
        key={`${row.bucket ?? ''}#${row.id}`}
        row={row}
        session={session}
        focused={row.id === recipeId}
        maxH={maxH}
        maxW={maxW}
        onPick={onPick}
        defaultMaterial={defaultMaterial}
        menuExtra={cardMenuExtra}
      />
    ));
  }

  return (
    <div
      ref={boxRef}
      {...swipe}
      className="flex min-h-0 flex-1 flex-col items-center justify-start gap-2 overflow-x-auto overflow-y-clip"
    >
      {body}
    </div>
  );
}

