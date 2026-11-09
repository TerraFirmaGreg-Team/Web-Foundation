'use client';
import { Card } from '@terrafirmagreg-team/ui/components/ui/card';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { sectionEmbeds } from '@terrafirmagreg-team/kit/lib/embeds';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { EntryList } from '@terrafirmagreg-team/game/components/entry/list';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/display/messages';
import { collectItemIds } from '@terrafirmagreg-team/guide/lib/data/parse';
import { pageTitle } from '@terrafirmagreg-team/guide/lib/nav/toc';
import { spriteName } from '@terrafirmagreg-team/guide/lib/display/names';
import { recipeIds, recipeNameScope } from '@terrafirmagreg-team/guide/lib/kind/recipe';

import type { PageRendererProps } from '@terrafirmagreg-team/guide/types';

export function RecipePage({
  dataset,
  page,
  lang,
  langMap,
  atlases,
  extras,
  messages,
}: PageRendererProps) {
  const ids = recipeIds(page);
  if (!ids.length) {
    return (
      <EmptyState variant="empty">
        {guideMessage(messages, 'guide.recipe_empty')}
      </EmptyState>
    );
  }
  const RecipeCard = sectionEmbeds().recipe?.Card;
  return (
    <div className="space-y-4">
      {ids.map((id) => {
        const recipe = extras?.recipes?.[id];
        if (recipe && RecipeCard) {
          return (
            <RecipeCard
              key={id}
              id={id}
              recipe={recipe}
              dataset={dataset}
              lang={lang}
              langMap={recipeNameScope(langMap, recipe)}
            />
          );
        }
        const name = spriteName(dataset, langMap, atlases, id);
        return (
          <Card key={id} className="min-w-0 flex-row items-center gap-2 px-3 py-2">
            {id.includes(':') ? (
              <Entry
                id={id}
                kind="item"
                dataset={dataset}
                name={name}
                labeled
                label={name}
              />
            ) : (
              <span className="text-sm">{name}</span>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export function SpotlightPage({
  dataset,
  page,
  langMap,
  extras,
}: PageRendererProps) {
  if (pageTitle(page, langMap, {}, extras?.entityNames)) return null;
  const ids = [...collectItemIds(page.item), ...collectItemIds(page.icon)];
  if (!ids.length) return null;
  return (
    <EntryList
      variant="row"
      labeled
      dataset={dataset}
      items={ids.map((id) => ({ id, kind: 'item' as const }))}
    />
  );
}

