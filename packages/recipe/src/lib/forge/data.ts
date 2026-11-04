import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { ForgeRecipe } from '@terrafirmagreg-team/recipe/types/forge';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { parseForgeRuleTooltip } from './actions';

export function toForgeRecipe(recipe: Recipe): ForgeRecipe {
  const tooltips = recipe.widgets.flatMap((widget) =>
    'tooltip' in widget ? (widget.tooltip ?? []) : [],
  );
  const parsed = tooltips.map(parseForgeRuleTooltip);
  return {
    recipe,
    rules: parsed.filter((rule) => rule !== undefined),
    rulesSupported:
      tooltips.length > 0 && parsed.every((rule) => rule !== undefined),
  };
}

const ANVIL_TIER_ORDER = [
  'rock',
  'stone',
  'copper',
  'bronze',
  'wrought_iron',
  'steel',
  'black_steel',
  'red_or_blue',
];

export function anvilGroup(recipe: Recipe): { id: string; icon?: string } {
  const catalyst = Object.values(recipe.slots).find(
    (slot) => slot.type === 'catalyst',
  );
  const ref = catalyst?.ref;
  if (!ref) return { id: '' };
  const id = ref.kind === 'itemTag' ? `#${ref.id}` : stackIdFromRef(ref);
  return { id, icon: catalyst?.alternatives?.[0]?.id ?? ref.id };
}

export function anvilGroupRank(groupId: string): number {
  const last = groupId
    .replace(/^#/, '')
    .split('/')
    .pop()!
    .split(':')
    .pop()!
    .replace(/_anvils?$/, '');
  const index = ANVIL_TIER_ORDER.indexOf(last);
  return index < 0 ? ANVIL_TIER_ORDER.length : index;
}

