'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useFavorites } from '@terrafirmagreg-team/recipe/hooks/use-favorites';
import { useFavoriteHotkey } from '@terrafirmagreg-team/recipe/hooks/use-favorite-hotkey';
import { useHideUnused } from '@terrafirmagreg-team/recipe/hooks/use-hide-unused';
import { usePagedList } from '@terrafirmagreg-team/ui/hooks/page/use-paged-list';
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
const PAGE_WINDOW = 5;

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

  const stripRef = useRef<HTMLDivElement | null>(null);
  const fromScroll = useRef(false);
  const pageRef = useRef(list.page);
  pageRef.current = list.page;
  const [startRaw, setStartRaw] = useState(list.page - (PAGE_WINDOW >> 1));
  const maxStart = Math.max(0, list.pages - PAGE_WINDOW);
  const start = Math.max(0, Math.min(startRaw, maxStart));
  const windowPages = useMemo(() => {
    const end = Math.min(list.pages, start + PAGE_WINDOW);
    const out: number[] = [];
    for (let i = start; i < end; i++) out.push(i);
    return out;
  }, [start, list.pages]);

  useEffect(() => {
    if (list.page < start || list.page > start + PAGE_WINDOW - 1) {
      setStartRaw(list.page - (PAGE_WINDOW >> 1));
    }
  }, [list.page, start]);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el || w <= 0) return;
    const target = list.page * w;
    if (Math.abs(el.scrollLeft - target) > 2) {
      el.scrollTo({
        left: target,
        behavior: fromScroll.current ? 'instant' : 'smooth',
      });
    }
    fromScroll.current = false;
  }, [list.page, start, w]);

  const idle = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(idle.current), []);

  const onStripScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (w <= 0) return;
    const next = Math.max(
      0,
      Math.min(list.pages - 1, Math.round(el.scrollLeft / w)),
    );
    if (next !== pageRef.current) {
      fromScroll.current = true;
      setPanelPage(next);
    }
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(
      () => setStartRaw(pageRef.current - (PAGE_WINDOW >> 1)),
      160,
    );
  };

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
      <div
        ref={stripRef}
        onScroll={onStripScroll}
        onWheel={(event) => {
          const el = stripRef.current;
          if (!el || w <= 0) return;
          el.scrollBy({
            left: Math.sign(event.deltaY) * w,
            behavior: 'smooth',
          });
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          aria-hidden
          className="h-full shrink-0"
          style={{ width: start * w }}
        />
        {windowPages.map((pageIndex) => (
          <div
            key={pageIndex}
            className="h-full w-full shrink-0 snap-center"
          >
            <ItemPanelGrid
              cells={cells.slice(
                pageIndex * pageSize,
                (pageIndex + 1) * pageSize,
              )}
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
          </div>
        ))}
        <div
          aria-hidden
          className="h-full shrink-0"
          style={{
            width:
              Math.max(0, list.pages - start - windowPages.length) * w,
          }}
        />
      </div>
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
      <div ref={boxRef} className="min-h-0 flex-1 overflow-hidden">
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

