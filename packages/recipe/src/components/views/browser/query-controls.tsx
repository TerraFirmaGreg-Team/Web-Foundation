'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@terrafirmagreg-team/ui/components/ui/input-group';
import { Pager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

type QueryNav = {
  dataset: DatasetRef;
  params?: RecipeHrefOpts;
};

export function QuerySearch({
  dataset,
  params,
  query,
  onQuery,
  placeholder,
  className,
}: QueryNav & {
  query: string;
  onQuery: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const resolved = useResolvedLang();
  return (
    <InputGroup className={cn('w-full', className)}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          onQuery(next);
          replaceUrlState(
            recipeHref(dataset, resolved, {
              ...params,
              search: next || undefined,
            }),
          );
        }}
      />
    </InputGroup>
  );
}

export function QueryPager({
  dataset,
  params,
  query,
  list,
  label,
  leading,
  className,
}: QueryNav & {
  query: string;
  list: {
    page: number;
    pages: number;
    from?: number;
    to: number;
    total: number;
  };
  label: string;
  leading?: ReactNode;
  className?: string;
}) {
  const resolved = useResolvedLang();
  return (
    <Pager
      layout="center"
      page={list.page}
      pages={list.pages}
      to={list.to}
      total={list.total}
      label={label}
      leading={leading}
      className={className}
      onPage={(next) =>
        replaceUrlState(
          recipeHref(dataset, resolved, {
            ...params,
            search: query || undefined,
            rpage: next + 1,
          }),
        )
      }
    />
  );
}

