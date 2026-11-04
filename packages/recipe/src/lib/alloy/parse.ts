import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { AlloyComponent, AlloyRecipe } from '@terrafirmagreg-team/recipe/types/alloy';
import { cleanForgeText } from '@terrafirmagreg-team/recipe/lib/forge/actions';

export function parseAlloyPercent(
  text: string,
): { min: number; max: number } | undefined {
  const match = /^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*%$/.exec(
    cleanForgeText(text),
  );
  if (!match) return undefined;
  const min = Number(match[1]);
  const max = Number(match[2]);
  return min >= 0 && min <= max && max <= 100 ? { min, max } : undefined;
}

export function toAlloyRecipe(recipe: Recipe): AlloyRecipe {
  const inputs = Object.entries(recipe.slots)
    .filter(([, slot]) => slot.type === 'input')
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([, slot]) => slot);
  const ranges = recipe.widgets
    .filter((widget) => widget.type === 'text')
    .map((widget) => ({
      x: widget.x,
      y: widget.y,
      range: parseAlloyPercent(widget.text ?? ''),
    }))
    .filter((widget) => widget.range !== undefined)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const components: AlloyComponent[] = inputs.map((slot, i) => ({
    slot,
    ...(ranges.length === inputs.length ? { range: ranges[i].range } : {}),
  }));
  return { recipe, components };
}

