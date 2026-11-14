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
import {
  favoriteHover,
  type FavoriteHoverTarget,
} from '@terrafirmagreg-team/recipe/lib/browser/favorite-hover';
import { IconPager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { FavoriteButton } from '@terrafirmagreg-team/recipe/components/views/browser/favorite-button';
import { ItemPanelGrid } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel-grid';
import { RecipeSettings } from '@terrafirmagreg-team/recipe/components/views/browser/settings';
import { QuerySearch } from '@terrafirmagreg-team/recipe/components/views/browser/query-controls';
import { Pager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { usePanelPage } from '@terrafirmagreg-team/recipe/hooks/use-panel-page';
import { dismissOpenTooltips } from '@terrafirmagreg-team/ui/lib/dismiss-tooltips';
import { useItemPress } from '@terrafirmagreg-team/recipe/hooks/use-item-press';
import { usePanelCells } from '@terrafirmagreg-team/recipe/hooks/use-panel-cells';
import { usePanelTabs } from '@terrafirmagreg-team/recipe/hooks/use-panel-tabs';
import { usePanelWarmup } from '@terrafirmagreg-team/recipe/hooks/use-panel-warmup';
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
  const { cells, favoriteIds, dIndex, dNames, dLang, used } =
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
  const stripRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef(false);
  const suppressScroll = useRef(0);
  const lastWheelAt = useRef(0);
  const flyTimer = useRef<number | undefined>(undefined);
  const [flying, setFlying] = useState(false);
  const [viewPage, setViewPage] = useState(list.page);
  useEffect(() => setViewPage(list.page), [list.page]);
  usePanelWarmup(dataset, cells, viewPage, pageSize);

  const gridResetKey = mode;
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

  const {
    tab: navTab,
    search: navSearch,
    tool: navTool,
    unit: navUnit,
    mix: navMix,
    version: navVersion,
  } = nav;
  const cellNav = useMemo<RecipeHrefOpts>(
    () => ({
      tab: navTab,
      search: navSearch,
      tool: navTool,
      unit: navUnit,
      mix: navMix,
      version: navVersion,
    }),
    [navTab, navSearch, navTool, navUnit, navMix, navVersion],
  );
  const onHover = useCallback((target: FavoriteHoverTarget | undefined) => {
    favoriteHover.base = target;
  }, []);

  const setTab = (next: string) => {
    selectPage(0);
    replaceUrlState(
      recipeHref(dataset, resolved, {
        ...nav,
        tab: next || undefined,
      }),
    );
  };

  const pageRef = useRef(list.page);
  useEffect(() => {
    pageRef.current = list.page;
  }, [list.page]);
  const selectPage = (next: number) => {
    const total = list.pages;
    const wrapped = total > 1 ? ((next % total) + total) % total : 0;
    pageRef.current = wrapped;
    setViewPage(wrapped);
    setPanelPage(wrapped);
  };
  const circular = list.pages > PAGE_WINDOW;
  const base = circular
    ? ((list.page - (PAGE_WINDOW >> 1)) % list.pages + list.pages) % list.pages
    : 0;
  const windowPages = useMemo(() => {
    if (!circular) {
      return Array.from({ length: list.pages }, (_, i) => i);
    }
    return Array.from(
      { length: PAGE_WINDOW },
      (_, i) => (base + i) % list.pages,
    );
  }, [circular, base, list.pages]);
  const windowCells = useMemo(
    () =>
      windowPages.map((p) => cells.slice(p * pageSize, (p + 1) * pageSize)),
    [cells, windowPages, pageSize],
  );

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el || w <= 0) return;
    const target = (circular ? PAGE_WINDOW >> 1 : list.page) * w;
    if (Math.abs(el.scrollLeft - target) > 2) {
      suppressScroll.current = performance.now() + 120;
      el.scrollLeft = target;
    }
  }, [list.page, circular, w]);

  const idle = useRef<number | undefined>(undefined);
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    const up = () => {
      drag.current = false;
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.clearTimeout(idle.current);
      window.clearTimeout(flyTimer.current);
    };
  }, []);
  const endScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el || w <= 0) return;
    setScrolling(false);
    const pos = Math.round(el.scrollLeft / w);
    const next = circular
      ? (((base + pos) % list.pages) + list.pages) % list.pages
      : Math.max(0, Math.min(list.pages - 1, pos));
    setViewPage(next);
    if (next !== pageRef.current) {
      pageRef.current = next;
      setPanelPage(next);
    }
  }, [w, circular, base, list.pages, setPanelPage]);

  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el || w <= 0) return;
    dismissOpenTooltips();
    if (performance.now() < suppressScroll.current) return;
    if (drag.current) setScrolling(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(endScroll, 160);
    const pos = Math.round(el.scrollLeft / w);
    setViewPage(
      circular
        ? (((base + pos) % list.pages) + list.pages) % list.pages
        : Math.max(0, Math.min(list.pages - 1, pos)),
    );
  };

  const tabOptions = usePanelTabs(dIndex, dNames, dLang, used);

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
        onPointerDown={() => {
          drag.current = true;
        }}
        onWheel={(event) => {
          if (w <= 0) return;
          const delta =
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
              ? event.deltaX
              : event.deltaY;
          const dir = Math.sign(delta);
          if (!dir) return;
          dismissOpenTooltips();
          const now = performance.now();
          if (now - lastWheelAt.current < 120) {
            setFlying(true);
            window.clearTimeout(flyTimer.current);
            flyTimer.current = window.setTimeout(
              () => setFlying(false),
              140,
            );
          }
          lastWheelAt.current = now;
          selectPage(pageRef.current + dir);
        }}
        className={cn(
          'flex h-full snap-x snap-proximity overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          (scrolling || flying) && '[&>*]:pointer-events-none',
        )}
      >
        {windowPages.map((pageIndex, i) => (
          <div
            key={pageIndex}
            className="h-full w-full shrink-0 snap-center"
            style={
              pageIndex === list.page
                ? undefined
                : {
                    contentVisibility: 'auto',
                    containIntrinsicSize: `${w}px ${h}px`,
                  }
            }
          >
            <ItemPanelGrid
              cells={windowCells[i]}
              resetKey={gridResetKey}
              dataset={dataset}
              lang={dLang}
              names={dNames}
              nav={cellNav}
              cols={cols}
              rows={rows}
              favIds={favIds}
              onPress={onPress}
              onHover={onHover}
              onToggleGroup={onToggleGroup}
              draggableStacks={isCalc}
              eager={pageIndex === viewPage}
              frozen={
                flying || (scrolling && pageIndex !== viewPage)
              }
            />
          </div>
        ))}
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
        loop
        page={viewPage}
        pages={list.pages}
        to={Math.min(list.total, (viewPage + 1) * pageSize)}
        total={list.total}
        label={t('{page}/{pages}', { note: 'recipe.page_of' })}
        onPage={selectPage}
        leading={
          <FavoriteButton
            variant="outline"
            active={mode === 'fav'}
            label={t('Favorites', { note: 'recipe.favorites' })}
            onToggle={() => {
              selectPage(0);
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
            selectPage(0);
            setQuery(next);
          }}
          placeholder={t('Search items', { note: 'recipe.search' })}
          className="w-full"
        />
      </div>
    </div>
  );
});

