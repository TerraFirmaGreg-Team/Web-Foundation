'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { ToolList } from '@terrafirmagreg-team/recipe/components/tool-list';
import { useToolRecipes } from '@terrafirmagreg-team/recipe/hooks/use-tool-recipes';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import {
  anvilGroup,
  anvilGroupRank,
  toForgeRecipe,
} from '@terrafirmagreg-team/recipe/lib/forge/data';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import type { ForgeRecipe } from '@terrafirmagreg-team/recipe/types/forge';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

function anvilGroupName(session: RecipeSession, id: string): string {
  if (!id) return '—';
  const resolved = recipeItemName(session.names, session.lang, id);
  return resolved === id
    ? (id.split('/').pop()?.replaceAll('_', ' ') ?? id)
    : resolved;
}

export function ForgeList({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const { value } = useToolRecipes(session, 'tfc:anvil', toForgeRecipe);
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLowerCase());
  const name = (id: string) => recipeItemName(session.names, session.lang, id);

  const tree = useMemo((): PageTree.Root => {
    const matches = (recipe: ForgeRecipe['recipe']) =>
      [
        recipe.id,
        ...recipe.inputs.map((slot) => slot.id),
        ...recipe.outputs.map((slot) => slot.id),
      ].some((id) => `${id} ${name(id)}`.toLowerCase().includes(search));

    const groups = [...Map.groupBy(value ?? [], (item) => anvilGroup(item.recipe).id)]
      .map(([id, rows]) => ({
        id,
        icon: anvilGroup(rows[0]!.recipe).icon,
        rows: search ? rows.filter((r) => matches(r.recipe)) : rows,
      }))
      .filter((group) => group.rows.length > 0)
      .sort(
        (a, b) => anvilGroupRank(a.id) - anvilGroupRank(b.id) || a.id.localeCompare(b.id),
      );

    const children: PageTree.Folder[] = groups.map((group) => ({
      type: 'folder',
      $id: `forge:${group.id}`,
      name: (
        <span className="-me-3 flex min-w-0 flex-1 items-center gap-1.5">
          <span className="truncate">{anvilGroupName(session, group.id)}</span>
          <span className="shrink-0 tabular-nums text-xs text-muted-foreground/70">
            ×{group.rows.length}
          </span>
        </span>
      ),
      icon: group.icon ? (
        <span className="inline-flex size-4 shrink-0 items-center justify-center">
          <Entry id={group.icon} kind="item" size="sm" href={false} tooltip={false} />
        </span>
      ) : undefined,
      defaultOpen: search !== '',
      children: group.rows.map(
        ({ recipe }): PageTree.Item => ({
          type: 'page',
          $id: recipe.id,
          url: recipeHref(session.dataset, session.lang, {
            tool: 'forge',
            id: recipe.id,
            tab: session.tab,
            version: session.nav.version,
          }),
          name: (
            <Entry
              id={recipe.outputs[0]?.id ?? recipe.id}
              kind={recipe.outputs[0]?.kind === 'fluid' ? 'fluid' : 'item'}
              size="sm"
              labeled
              href={false}
              tooltip={false}
              className="min-w-0 flex-1 justify-start truncate"
            />
          ),
        }),
      ),
    }));

    return {
      name: 'forge',
      $id: `forge:${session.lang}:${search}:${(value ?? []).length}`,
      children,
    } as PageTree.Root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, search, session.lang, session.dataset, session.tab]);

  return (
    <ToolList
      tree={tree}
      loaded={value !== undefined}
      query={query}
      onQuery={setQuery}
      searchLabel={t('Search recipes', { note: 'recipe.forge.search' })}
      emptyLabel={t('No matching recipes in this dump.', { note: 'recipe.forge.empty' })}
    />
  );
}

