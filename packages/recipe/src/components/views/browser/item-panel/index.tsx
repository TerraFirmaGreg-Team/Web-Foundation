'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useFavorites } from '@terrafirmagreg-team/recipe/hooks/use-favorites';
import { useFavoriteHotkey } from '@terrafirmagreg-team/recipe/hooks/use-favorite-hotkey';
import { useHideUnused } from '@terrafirmagreg-team/recipe/hooks/use-hide-unused';
import { usePagedList } from '@terrafirmagreg-team/ui/hooks/page/use-paged-list';
import { useSwipe } from '@terrafirmagreg-team/ui/hooks/use-swipe';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { type ItemPanelMode } from '@terrafirmagreg-team/recipe/lib/browser/panel';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { favoriteHover } from '@terrafirmagreg-team/recipe/lib/browser/favorite-hover';
import { IconPager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { FavoriteButton } from '@terrafirmagreg-team/recipe/components/views/browser/favorite-button';
import { ItemPanelGrid } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel-grid';
import { RecipeSettings } from '@terrafirmagreg-team/recipe/components/views/browser/settings';
import { QuerySearch } from '@terrafirmagreg-team/recipe/components/views/browser/query-controls';
import { Pager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { usePanelPage } from '@terrafirmagreg-team/recipe/hooks/use-panel-page';
import { useItemPress } from '@terrafirmagreg-team/recipe/hooks/use-item-press';
import { usePanelCells } from '@terrafirmagreg-team/recipe/hooks/use-panel-cells';
import { usePanelTabs } from '@terrafirmagreg-team/recipe/hooks/use-panel-tabs';
import {
  RecipePanelSkeleton,
  RecipeTabsSkeleton,
} from '@terrafirmagreg-team/recipe/components/views/browser/item-panel/skeleton';
import {
  isDatasetFailed,
  useFailedDatasets,
} from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  RecipeCompactIndex,
  RecipeHrefOpts,
} from '@terrafirmagreg-team/recipe/types';

const CELL = 40;
const PANEL_COLS = 10;

export const ItemPanel = memo(function ItemPanel({
  dataset,
  lang,
  index,
  indexLoading,
  names,
  tab,
  query,
  setQuery,
  isCalc,
  nav,
  className,
}: {
  dataset: DatasetRef;
  lang: Lang;
  index: RecipeCompactIndex | null;
  indexLoading: boolean;
  names: Record<string, Record<string, string>>;
  tab?: string;
  query: string;
  setQuery: (query: string) => void;
  isCalc: boolean;
  nav: RecipeHrefOpts;
  className?: string;
}) {
  const t = useTranslations();
  const favorites = useFavorites();
  const { hideUnused } = useHideUnused();
  const [mode, setMode] = useState<ItemPanelMode>('all');
  const boxRef = useRef<HTMLDivElement | null>(null);
  useFavoriteHotkey();
  const { w, h } = useElementSize(boxRef);
  const cols = Math.min(PANEL_COLS, Math.max(1, Math.floor((w + 4) / CELL)));
  const rows = Math.max(1, Math.floor((h + 4) / CELL));
  const pageSize = cols * rows;
  const measured = w > 0 && h > 0;

  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const { cells, filtered, favoriteIds, dIndex, dNames, dLang } =
    usePanelCells({
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
    });
  const favIds = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const { page: panelPage, setPage: setPanelPage } = usePanelPage(dataset);
  const list = usePagedList(cells, panelPage, pageSize);

  const gridResetKey = useMemo(
    () => [mode, filtered, favorites.entries],
    [mode, filtered, favorites.entries],
  );
  const onToggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const resolved = useResolvedLang();
  const onPress = useItemPress({ dataset, nav, isCalc });

  const setTab = (next: string) => {
    setPanelPage(0);
    replaceUrlState(
      recipeHref(dataset, resolved, {
        ...nav,
        tab: next || undefined,
      }),
    );
  };

  const goPage = (dir: number) => {
    if (list.pages <= 1) return;
    setPanelPage((list.page + dir + list.pages) % list.pages);
  };
  const swipe = useSwipe(goPage);

  const tabOptions = usePanelTabs(dIndex, dNames, dLang);

  const failed = isDatasetFailed(useFailedDatasets(), dataset);

  let body;
  const indexEmpty = !index?.items.length;
  if (!measured || ((indexLoading || failed) && indexEmpty)) {
    body =
      (indexLoading || failed) && indexEmpty ? (
        <RecipePanelSkeleton cols={cols} rows={rows} />
      ) : null;
  } else if (!list.shown.length) {
    body = (
      <EmptyState variant="empty">
        {mode === 'fav'
          ? t('No favorites yet.', { note: 'recipe.favorites_empty' })
          : hideUnused && !query.trim()
            ? t('No items match with Hide unused enabled. Turn it off to browse the full catalog.', { note: 'recipe.hide_unused_empty' })
            : t('No matching items.', { note: 'recipe.empty_items' })}
      </EmptyState>
    );
  } else {
    body = (
      <ItemPanelGrid
        cells={list.shown}
        resetKey={gridResetKey}
        dataset={dataset}
        lang={dLang}
        names={dNames}
        nav={nav}
        cols={cols}
        rows={rows}
        favIds={favIds}
        onPress={onPress}
        onHover={(target) => {
          favoriteHover.base = target;
        }}
        onToggleGroup={onToggleGroup}
        draggableStacks={isCalc}
      />
    );
  }

  return (
    <div className={cn('not-prose flex min-h-0 flex-col gap-2', className)}>
      {(indexLoading || failed) && indexEmpty ? (
        <RecipeTabsSkeleton />
      ) : (
        <IconPager
          value={mode === 'fav' ? 'fav' : (tab ?? '')}
          options={tabOptions}
          onChange={(id) => {
            setMode('all');
            setTab(id);
          }}
        />
      )}
      <Pager
        page={list.page}
        pages={list.pages}
        to={list.to}
        total={list.total}
        label={t('{page}/{pages}', { note: 'recipe.page_of' })}
        onPage={setPanelPage}
        leading={
          <FavoriteButton
            variant="outline"
            active={mode === 'fav'}
            label={t('Favorites', { note: 'recipe.favorites' })}
            onToggle={() => {
              setPanelPage(0);
              setMode(mode === 'fav' ? 'all' : 'fav');
            }}
            className="size-9 [&_svg]:size-4.5"
          />
        }
      />
      <div
        ref={boxRef}
        {...swipe}
        onWheel={(event) => goPage(event.deltaY > 0 ? 1 : -1)}
        className="min-h-0 flex-1"
      >
        {body}
      </div>
      <div className="mx-auto flex w-full max-w-md items-center gap-2">
        <RecipeSettings />
        <QuerySearch
          dataset={dataset}
          params={nav}
          query={query}
          onQuery={(next) => {
            setPanelPage(0);
            setQuery(next);
          }}
          placeholder={t('Search items', { note: 'recipe.search' })}
          className="w-full"
        />
      </div>
    </div>
  );
});

