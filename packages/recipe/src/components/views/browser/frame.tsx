'use client';

import Link from 'next/link';
import { useRef, type ReactNode } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';
import {
  QueryPager,
  QuerySearch,
} from '@terrafirmagreg-team/recipe/components/views/browser/query-controls';
import { Pager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { RecipeToolbar } from '@terrafirmagreg-team/recipe/components/views/browser/toolbar';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

type FeedList = {
  page: number;
  pages: number;
  from?: number;
  to: number;
  total: number;
};

export function RecipeFrame({
  session,
  header,
  list,
  strip,
  rail,
  back,
  search,
  searchPersist = true,
  onPageChange,
  children,
}: {
  session: RecipeSession;
  header: ReactNode;
  list?: FeedList;
  strip?: ReactNode;
  rail?: ReactNode;
  back?: { href: string; label: string };
  search?: boolean;
  searchPersist?: boolean;
  onPageChange?: (page: number) => void;
  children: ReactNode;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const railBoxRef = useRef<HTMLDivElement | null>(null);
  const railSize = useElementSize(railBoxRef);
  const setPage = (next: number) => {
    if (!list) return;
    const clamped = Math.min(list.pages - 1, Math.max(0, next));
    if (clamped === list.page) return;
    if (onPageChange) {
      onPageChange(clamped);
      return;
    }
    replaceUrlState(
      recipeHref(session.dataset, resolved, {
        ...session.nav,
        id: undefined,
        rpage: clamped > 0 ? clamped + 1 : undefined,
      }),
    );
  };
  const goPage = (dir: number) => {
    if (!list || list.pages <= 1) return;
    setPage((list.page + dir + list.pages) % list.pages);
  };
  const onPagerWheel = (event: { deltaY: number }) =>
    goPage(event.deltaY > 0 ? 1 : -1);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {strip ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{strip}</div>
        </div>
      ) : null}
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 border-b border-border pb-2 pt-2 max-sm:pe-11">
        <div className="flex min-w-0 justify-start">
          {back ? (
            <Link
              href={back.href}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              ← {back.label}
            </Link>
          ) : null}
        </div>
        <div className="min-w-0 max-w-full">{header}</div>
        <div className="flex min-w-0 items-center justify-self-end max-sm:absolute max-sm:end-1.5 max-sm:top-1/2 max-sm:-translate-y-1/2">
          <RecipeToolbar session={session} />
        </div>
      </div>
      {list ? (
        <div onWheel={onPagerWheel} className="mx-auto w-full pt-2 sm:max-w-90">
          {onPageChange ? (
            <Pager
              layout="spread"
              page={list.page}
              pages={list.pages}
              to={list.to}
              total={list.total}
              label={t('{page}/{pages}', { note: 'recipe.page_of' })}
              onPage={onPageChange}
            />
          ) : (
            <QueryPager
              dataset={session.dataset}
              params={{ ...session.nav, id: undefined }}
              query={session.query}
              list={list}
              label={t('{page}/{pages}', { note: 'recipe.page_of' })}
            />
          )}
        </div>
      ) : null}
      <div className="relative flex min-h-0 flex-1 overflow-hidden pt-2">
        {rail ? (
          <div ref={railBoxRef} className="z-10 flex shrink-0 flex-col">
            {rail}
          </div>
        ) : null}
        <div
          onWheel={(event) => goPage(event.deltaY > 0 ? 1 : -1)}
          className="flex min-w-0 flex-1 flex-col"
          style={rail ? { paddingInlineEnd: railSize.w } : undefined}
        >
          {children}
        </div>
      </div>
      {search ? (
        <div className="flex shrink-0 justify-center pb-1 pt-1.5">
          <div className="w-56 sm:w-72">
            <QuerySearch
              dataset={session.dataset}
              param="rsearch"
              params={{ ...session.nav, id: undefined, rpage: undefined }}
              query={session.rquery}
              onQuery={session.setRquery}
              persist={searchPersist}
              placeholder={t('Search materials', {
                note: 'recipe.search_materials',
              })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

