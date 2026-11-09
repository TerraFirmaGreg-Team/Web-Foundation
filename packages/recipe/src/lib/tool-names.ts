import { humanizeKey } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

const TOOL_KEYS: Record<string, [string, string]> = {
  calc: ['Calculator', 'recipe.calculator'],
  forge: ['Forging', 'recipe.forge.title'],
  alloy: ['Alloys', 'recipe.alloy.title'],
};

export function recipeToolName(tool: string, lang: Lang): string {
  const [source, note] = TOOL_KEYS[tool] ?? [];
  if (!source || !note) return humanizeKey(tool);
  const registry = loadLocaleRegistry();
  const messages =
    registry.messages[lang] ??
    registry.messages[registry.defaultLanguage] ??
    {};
  return messages[`${source}(${note})`] ?? source;
}
