'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { QueryPager } from '@terrafirmagreg-team/recipe/components/views/browser/query-controls';
import { Pager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { RecipeToolbar } from '@terrafirmagreg-team/recipe/components/views/browser/toolbar';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
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
  navPrev,
  navNext,
  onNavWheel,
  onPageChange,
  children,
}: {
  session: RecipeSession;
  header: ReactNode;
  list?: FeedList;
  strip?: ReactNode;
  rail?: ReactNode;
  back?: { href: string; label: string };
  navPrev?: ReactNode;
  navNext?: ReactNode;
  onNavWheel?: (dir: -1 | 1) => void;
  onPageChange?: (page: number) => void;
  children: ReactNode;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const goPage = (dir: number) => {
    if (!list || list.pages <= 1) return;
    const next = (list.page + dir + list.pages) % list.pages;
    if (onPageChange) {
      onPageChange(next);
      return;
    }
    replaceUrlState(
      recipeHref(session.dataset, resolved, {
        ...session.nav,
        id: undefined,
        rpage: next > 0 ? next + 1 : undefined,
      }),
    );
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
      <div
        className={cn(
          'relative grid items-center gap-x-3 border-b border-border pb-2 pt-2 max-sm:pe-11',
          navPrev || navNext
            ? 'grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(0,360px)_minmax(0,1fr)]'
            : 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
        )}
      >
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
        {navPrev || navNext ? (
          <div
            onWheel={
              onNavWheel
                ? (event) => onNavWheel(event.deltaY > 0 ? 1 : -1)
                : undefined
            }
            className="flex w-full max-w-90 min-w-0 items-center gap-2"
          >
            {navPrev}
            <div className="min-w-0 flex-1">{header}</div>
            {navNext}
          </div>
        ) : (
          <div className="min-w-0 max-w-full">{header}</div>
        )}
        <div className="flex min-w-0 items-center justify-self-end max-sm:absolute max-sm:end-1.5 max-sm:top-1/2 max-sm:-translate-y-1/2">
          <RecipeToolbar session={session} />
        </div>
      </div>
      {list ? (
        <div onWheel={onPagerWheel} className="mx-auto w-full sm:max-w-90">
          {onPageChange ? (
            <Pager
              layout="spread"
              page={list.page}
              pages={list.pages}
              to={list.to}
              total={list.total}
              label={t('{page}/{pages}', { note: 'recipe.page_of' })}
              className="pt-2"
              onPage={onPageChange}
            />
          ) : (
            <QueryPager
              dataset={session.dataset}
              params={{ ...session.nav, id: undefined }}
              query={session.query}
              list={list}
              label={t('{page}/{pages}', { note: 'recipe.page_of' })}
              className="pt-2"
            />
          )}
        </div>
      ) : null}
      <div className="relative flex min-h-0 flex-1 overflow-hidden pt-2">
        {rail ? (
          <div className="z-10 flex flex-col sm:absolute sm:start-0 sm:top-2 sm:bottom-0">
            {rail}
          </div>
        ) : null}
        <div
          onWheel={(event) => goPage(event.deltaY > 0 ? 1 : -1)}
          className="flex min-w-0 flex-1 flex-col"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

