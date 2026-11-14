'use client';

import { useMemo, useRef } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { RecipeFrame } from '@terrafirmagreg-team/recipe/components/views/browser/frame';
import { ItemViewHeader } from '@terrafirmagreg-team/recipe/components/views/browser/item-view-header';
import {
  RecipeCardGrid,
  recipeCardDim,
} from '@terrafirmagreg-team/recipe/components/views/browser/card-grid';
import { RecipeTypeTabs } from '@terrafirmagreg-team/recipe/components/views/browser/type-tabs';
import { WorkstationRail } from '@terrafirmagreg-team/recipe/components/views/browser/workstation-rail';
import { PaneTabs } from '@terrafirmagreg-team/recipe/components/views/browser/pane-tabs';
import { useFitPages } from '@terrafirmagreg-team/ui/hooks/page/use-fit-pages';
import { useCategoriesById } from '@terrafirmagreg-team/recipe/hooks/use-categories-by-id';
import { useTypeFilter } from '@terrafirmagreg-team/recipe/hooks/use-type-filter';
import { useFavorites } from '@terrafirmagreg-team/recipe/hooks/use-favorites';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import {
  EMPTY_ROWS,
  useItemFeeds,
} from '@terrafirmagreg-team/recipe/hooks/use-item-feeds';
import { useItemTagGroups } from '@terrafirmagreg-team/recipe/hooks/use-item-tag-groups';
import { ItemTagGroups } from '@terrafirmagreg-team/recipe/components/views/browser/item-view/tags';
import { useItemPane } from '@terrafirmagreg-team/recipe/hooks/use-item-pane';
import { useAddToCalc } from '@terrafirmagreg-team/recipe/hooks/use-add-to-calc';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { parseStackId, stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { customStackName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type {
  RecipeSession,
} from '@terrafirmagreg-team/recipe/types';

export function ItemView({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const {
    dataset,
    lang,
    index,
    indexLoading,
    names,
    nav,
    rpage,
    recipeId,
    relation,
  } = session;
  const item = (session.item ?? session.fluid)!;
  const kind = session.item ? 'item' : 'fluid';
  const parsed = useMemo(() => parseStackId(item), [item]);
  const favorites = useFavorites();
  const name =
    customStackName(session.langMap, item) ??
    recipeItemName(names, lang, item);

  const boxRef = useRef<HTMLDivElement | null>(null);

  const categoriesById = useCategoriesById(index);

  const feeds = useItemFeeds({ dataset, index, indexLoading, item, kind });
  const { recipes, uses } = feeds;
  const tags = useItemTagGroups({ dataset, index, item, kind });
  const pane = useItemPane({
    dataset,
    nav,
    relation,
    recipeId,
    recipes,
    uses,
    tagCount: tags.ids.length,
    feedsPending: feeds.pending,
  });
  const addToCalc = useAddToCalc(session);

  const feedRows = (pane.pane === 'uses' ? uses : recipes) ?? EMPTY_ROWS;
  const typeFilter = useTypeFilter(session, feedRows);
  const railRefs = useMemo(() => {
    const seen = new Set<string>();
    const refs: TaggedReference[] = [];
    for (const ref of
      categoriesById.get(typeFilter.active)?.workstations ?? []) {
      const key = stackIdFromRef(ref);
      if (!seen.has(key)) {
        seen.add(key);
        refs.push(ref);
      }
    }
    return refs;
  }, [categoriesById, typeFilter.active]);
  const focusIndex = recipeId
    ? typeFilter.rows.findIndex((row) => row.id === recipeId)
    : -1;
  const list = useFitPages(
    boxRef,
    typeFilter.rows,
    (row, box) => {
      const d = recipeCardDim(index, categoriesById, row);
      return d.h > box.h ? { w: d.w, h: box.h } : d;
    },
    rpage,
    8,
    focusIndex >= 0 ? focusIndex : undefined,
    true,
  );

  const onSwipe = (dir: -1 | 1) => {
    if (recipeId) {
      const row = typeFilter.rows[focusIndex + dir];
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

  return (
    <RecipeFrame
      session={session}
      list={pane.pane === 'tags' ? undefined : list}
      strip={
        <RecipeTypeTabs
          session={session}
          ids={pane.pane !== 'tags' ? typeFilter.ids : []}
          value={typeFilter.active}
          onChange={typeFilter.setActive}
        />
      }
      header={
        <div className="flex flex-col gap-1.5">
          <ItemViewHeader
            item={item}
            kind={kind}
            name={name}
            parsed={parsed}
            favorite={favorites.isFavorite(item)}
            onToggleFavorite={() => favorites.toggleItem(item)}
            onAddToCalc={() => addToCalc(item, kind)}
          />
          <PaneTabs
            value={pane.pane}
            options={pane.options}
            onChange={pane.select}
          />
        </div>
      }
      rail={
        pane.pane !== 'tags' ? (
          <WorkstationRail session={session} workstations={railRefs} />
        ) : undefined
      }
    >
      {pane.pane === 'tags' ? (
        <ItemTagGroups
          groups={tags.groups}
          dataset={dataset}
          query={session.query}
          nav={nav}
        />
      ) : (
        <RecipeCardGrid
          session={session}
          rows={list.shown}
          boxRef={boxRef}
          maxH={list.box.h}
          maxW={list.box.w}
          loading={feeds.pending}
          empty={t('No recipes of this type.', { note: 'recipe.empty_type' })}
          onSwipe={onSwipe}
        />
      )}
    </RecipeFrame>
  );
}

