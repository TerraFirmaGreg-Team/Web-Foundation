'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { ToolList } from '@terrafirmagreg-team/recipe/components/tool-list';
import { useToolRecipes } from '@terrafirmagreg-team/recipe/hooks/use-tool-recipes';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { toAlloyRecipe } from '@terrafirmagreg-team/recipe/lib/alloy/parse';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { AlloyMiniBar } from './stack-bar';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function AlloyList({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const { value } = useToolRecipes(session, 'tfc:alloying', toAlloyRecipe);
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLowerCase());
  const name = (id: string) => recipeItemName(session.names, session.lang, id);

  const tree = useMemo((): PageTree.Root => {
    const rows = !search
      ? (value ?? [])
      : (value ?? []).filter(({ recipe, components }) =>
          [
            recipe.id,
            `${recipe.outputs[0]?.id ?? ''} ${name(
              recipe.outputs[0]?.id ?? '',
            )}`,
            ...components.map(({ slot }) => `${slot.id} ${name(slot.id)}`),
          ].some((id) => id.toLowerCase().includes(search)),
        );

    const children: PageTree.Item[] = rows.map(({ recipe, components }) => {
      return {
        type: 'page',
        $id: recipe.id,
        url: recipeHref(session.dataset, session.lang, {
          tool: 'alloy',
          id: recipe.id,
          unit: session.alloyUnit,
          tab: session.tab,
        }),
        name: (
          <>
            <Entry
              id={recipe.outputs[0]?.id ?? recipe.id}
              kind={recipe.outputs[0]?.kind === 'fluid' ? 'fluid' : 'item'}
              size="sm"
              labeled
              href={false}
              tooltip={false}
              className="min-w-0 flex-1 justify-start truncate"
            />
            <AlloyMiniBar
              dataset={session.dataset}
              components={components}
              className="ms-auto h-1.5 w-10 shrink-0"
            />
          </>
        ),
      };
    });

    return {
      name: 'alloy',
      $id: `alloy:${session.lang}:${search}:${rows.length}`,
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
      searchLabel={t('Search alloys', { note: 'recipe.alloy.search' })}
      emptyLabel={t('No matching recipes in this dump.', { note: 'recipe.alloy.empty' })}
    />
  );
}

