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
  onPageChange,
  children,
}: {
  session: RecipeSession;
  header: ReactNode;
  list?: FeedList;
  strip?: ReactNode;
  rail?: ReactNode;
  back?: { href: string; label: string };
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
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {strip ? (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{strip}</div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-2 pt-2">
        {back ? (
          <Link
            href={back.href}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            ← {back.label}
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">{header}</div>
        <div className="ms-auto flex items-center gap-2">
          <RecipeToolbar session={session} />
        </div>
      </div>
      {list ? (
        onPageChange ? (
          <Pager
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
        )
      ) : null}
      <div className="flex min-h-0 flex-1 gap-2 overflow-hidden pt-2">
        {rail}
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

