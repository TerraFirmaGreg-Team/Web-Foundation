import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import type { ForgeRule, ForgeRuleAction } from '@terrafirmagreg-team/recipe/types/forge';

const FORGE_STEP_LANG_PREFIX = 'tfc.enum.forgestep.';
const HIT_VARIANTS = new Set(['light', 'medium', 'hard']);

export function forgeActionLabel(
  langMap: Record<string, string>,
  id: string,
): string {
  const key = HIT_VARIANTS.has(id) ? `hit_${id}` : id;
  return langString(langMap, `${FORGE_STEP_LANG_PREFIX}${key}`) ?? id;
}

export const FORGE_ACTIONS = [
  { id: 'light', action: 'hit', delta: -3 },
  { id: 'medium', action: 'hit', delta: -6 },
  { id: 'hard', action: 'hit', delta: -9 },
  { id: 'draw', action: 'draw', delta: -15 },
  { id: 'punch', action: 'punch', delta: 2 },
  { id: 'bend', action: 'bend', delta: 7 },
  { id: 'upset', action: 'upset', delta: 13 },
  { id: 'shrink', action: 'shrink', delta: 16 },
] as const satisfies readonly {
  id: string;
  action: ForgeRuleAction;
  delta: number;
}[];

export function cleanForgeText(text: string): string {
  return text.replace(/§./g, '').trim();
}

export function parseForgeRuleTooltip(text: string): ForgeRule | undefined {
  const match =
    /^(Hit|Draw|Punch|Bend|Upset|Shrink) (Last|Second Last|Third Last|Not Last|Any)$/i.exec(
      cleanForgeText(text),
    );
  if (!match) return undefined;
  return {
    action: match[1].toLowerCase() as ForgeRule['action'],
    order: match[2].toLowerCase().replaceAll(' ', '_') as ForgeRule['order'],
  };
}

export function forgeRulesMatch(
  rules: readonly ForgeRule[],
  last: readonly (ForgeRuleAction | '')[],
): boolean {
  return rules.every(({ action, order }) => {
    if (order === 'last') return last[0] === action;
    if (order === 'second_last') return last[1] === action;
    if (order === 'third_last') return last[2] === action;
    return (order === 'not_last' ? last.slice(1, 3) : last.slice(0, 3)).includes(
      action,
    );
  });
}

