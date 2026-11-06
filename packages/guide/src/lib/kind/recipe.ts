import type { GuidePage } from '@terrafirmagreg-team/guide/types';
import type { EmbedRecipe } from '@terrafirmagreg-team/kit/types/embeds';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';

export function recipeIds(page: GuidePage): string[] {
  return [
    ...new Set(
      (page.recipes ?? []).filter(
        (id): id is string => typeof id === 'string' && Boolean(id),
      ),
    ),
  ];
}

export function recipeNameScope(
  langMap: Record<string, string>,
  recipe: EmbedRecipe,
): Record<string, string> {
  const ids = new Set<string>([recipe.id]);
  for (const ing of [...recipe.inputs, ...recipe.outputs]) ids.add(ing.id);
  for (const fill of Object.values(recipe.slots ?? {})) {
    ids.add(fill.id);
    for (const alt of fill.alternatives ?? []) ids.add(alt.id);
  }
  for (const widget of recipe.widgets ?? []) {
    if (widget.type === 'slot') {
      ids.add(widget.id);
      for (const alt of widget.alternatives ?? []) ids.add(alt);
    }
  }
  const names: Record<string, string> = { ...langMap };
  for (const id of ids) names[id] = stackDisplayName(langMap, id);
  return names;
}

