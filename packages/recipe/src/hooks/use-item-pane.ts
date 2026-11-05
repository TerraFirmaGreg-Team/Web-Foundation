'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { createElement, useMemo } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Tag } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { usePaneKeys } from '@terrafirmagreg-team/ui/hooks/use-pane-keys';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { EMPTY_ROWS } from '@terrafirmagreg-team/recipe/hooks/use-item-feeds';
import type { PaneTabOption } from '@terrafirmagreg-team/recipe/components/views/browser/pane-tabs';
import type {
  RecipeCompactRow,
  RecipeHrefOpts,
  RecipeRelation,
} from '@terrafirmagreg-team/recipe/types';

export type ItemPane = 'recipes' | 'uses' | 'tags';

const inFeed = (id: string | undefined, rows: RecipeCompactRow[] | undefined) =>
  id != null && (rows ?? EMPTY_ROWS).some((row) => row.id === id);

export function useItemPane({
  dataset,
  nav,
  relation,
  recipeId,
  recipes,
  uses,
  tagCount,
  feedsPending,
}: {
  dataset: DatasetRef;
  nav: RecipeHrefOpts;
  relation?: RecipeRelation;
  recipeId?: string;
  recipes?: RecipeCompactRow[];
  uses?: RecipeCompactRow[];
  tagCount: number;
  feedsPending: boolean;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const available = {
    recipes: (recipes ?? EMPTY_ROWS).length > 0,
    uses: (uses ?? EMPTY_ROWS).length > 0,
    tags: tagCount > 0,
  };
  const fallback: ItemPane =
    inFeed(recipeId, uses) && !inFeed(recipeId, recipes)
      ? 'uses'
      : available.recipes
        ? 'recipes'
        : available.uses
          ? 'uses'
          : 'recipes';
  const pane: ItemPane =
    relation && (feedsPending || available[relation]) ? relation : fallback;
  const select = (next: ItemPane) => {
    replaceUrlState(
      recipeHref(dataset, resolved, {
        ...nav,
        relation: next === 'recipes' ? undefined : next,
        rpage: undefined,
      }),
    );
  };
  usePaneKeys<ItemPane>(
    {
      r: available.recipes ? 'recipes' : undefined,
      u: available.uses ? 'uses' : undefined,
      t: available.tags ? 'tags' : undefined,
    },
    select,
  );
  const options = useMemo<PaneTabOption<ItemPane>[]>(
    () => [
      {
        id: 'recipes',
        label: t('Recipes', { note: 'recipe.pane_recipes' }),
        icon: createElement(ArrowDownToLine, { className: 'size-3.5' }),
        help: 'R',
        disabled: !available.recipes,
      },
      {
        id: 'uses',
        label: t('Uses', { note: 'recipe.pane_uses' }),
        icon: createElement(ArrowUpFromLine, { className: 'size-3.5' }),
        help: 'U',
        disabled: !available.uses,
      },
      {
        id: 'tags',
        label: t('Tags', { note: 'recipe.pane_tags' }),
        icon: createElement(Tag, { className: 'size-3.5' }),
        help: 'T',
        disabled: !available.tags,
      },
    ],
    [available.recipes, available.uses, available.tags, t],
  );
  return { pane, select, options };
}

