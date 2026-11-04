import { stackDisplayName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { asNumber, asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type { DumpRecipeLayout } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { hydrateRecipe } from './layout';
import { parseSlots } from './slots';
import { parseDecorWidgets } from './widgets';

function parseProperties(value: unknown): Record<string, unknown> {
  const row = asRecord(value);
  return row ? { ...row } : {};
}

function recipeModId(id: string): string {
  const colon = id.indexOf(':');
  return colon > 0 ? id.slice(0, colon) : id;
}

export function parseRecipe(
  raw: unknown,
  ctx: {
    modId?: string;
    bodyUrl: string;
    id?: string;
    layout?: DumpRecipeLayout;
  },
): Recipe | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  const id = ctx.id ?? asString(row.id);
  if (!id) return undefined;
  const category = asString(row.category);
  if (!category) return undefined;
  const slots = parseSlots(row.slots);
  const decorWidgets = parseDecorWidgets(row.widgets);
  const properties = parseProperties(row.properties);
  const image = asString(row.image);
  const w = asNumber(row.w);
  const h = asNumber(row.h);
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (
      key === 'category' ||
      key === 'slots' ||
      key === 'widgets' ||
      key === 'properties' ||
      key === 'image' ||
      key === 'w' ||
      key === 'h'
    ) {
      continue;
    }
    extra[key] = value;
  }
  const recipe: Recipe = {
    id,
    type: category,
    modId: ctx.modId ?? recipeModId(id),
    category,
    slots,
    properties,
    inputs: [],
    outputs: [],
    widgets: decorWidgets,
    bodyUrl: ctx.bodyUrl,
    ...(image ? { image } : {}),
    ...(w !== undefined ? { w } : {}),
    ...(h !== undefined ? { h } : {}),
    extra,
  };
  return hydrateRecipe(recipe, ctx.layout);
}

export function recipeTitle(
  recipe: Pick<Recipe, 'id' | 'outputs'>,
  map: Record<string, string>,
): string {
  const main = recipe.outputs[0];
  if (main) {
    const name = stackDisplayName(map, main.id);
    if (name !== main.id) return name;
  }
  return recipe.id;
}

