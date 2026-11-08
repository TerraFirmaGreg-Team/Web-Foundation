import type { Recipe, RecipeIngredient } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type {
  CalcKind,
  CalcMaterial,
  CalcRecipe,
  CalcRecipeInput,
} from '@terrafirmagreg-team/recipe/types/calc';

function slotKind(slot: { kind: RecipeIngredient['kind'] }): CalcKind {
  return slot.kind === 'fluid' ? 'fluid' : 'item';
}

const GT_TIERS: Record<string, number> = {
  ULV: 0,
  LV: 1,
  MV: 2,
  HV: 3,
  EV: 4,
  IV: 5,
  LuV: 6,
  ZPM: 7,
  UV: 8,
  UHV: 9,
  UEV: 10,
  UIV: 11,
  UXV: 12,
  OpV: 13,
  MAX: 14,
};

function recipeTier(recipe: Recipe): number | undefined {
  for (const widget of recipe.widgets) {
    if (widget.type !== 'text' || !widget.component) continue;
    for (const part of [
      widget.component,
      ...(widget.component.extra ?? []),
    ]) {
      if (part.translate !== 'gtceu.recipe.eu') continue;
      for (const arg of part.with ?? []) {
        if (arg.text && arg.text in GT_TIERS) return GT_TIERS[arg.text];
      }
    }
  }
  return undefined;
}

export function toCalcRecipe(recipe: Recipe): CalcRecipe {
  const inputs: CalcRecipeInput[] = recipe.inputs.map((slot) => ({
    id: slot.id,
    kind: slotKind(slot),
    amount: slot.count && slot.count > 0 ? slot.count : 1,
    catalyst: false,
    ...(slot.chance !== undefined ? { chance: slot.chance } : {}),
    ...(slot.kind === 'tag' ? { tagId: slot.id } : {}),
  }));
  for (const widget of recipe.widgets) {
    if (widget.type !== 'slot' || widget.role !== 'catalyst') continue;
    inputs.push({
      id: widget.id,
      kind: widget.kind === 'fluid' ? 'fluid' : 'item',
      amount: 1,
      catalyst: true,
      ...(widget.chance !== undefined ? { chance: widget.chance } : {}),
      ...(widget.kind === 'tag' ? { tagId: widget.id } : {}),
    });
  }
  const merged: CalcRecipeInput[] = [];
  for (const input of inputs) {
    const key = `${input.kind}:${input.id}:${input.catalyst}:${input.tagId ?? ''}:${input.chance ?? ''}`;
    const existing = merged.find(
      (row) =>
        `${row.kind}:${row.id}:${row.catalyst}:${row.tagId ?? ''}:${row.chance ?? ''}` ===
        key,
    );
    if (existing) existing.amount += input.amount;
    else merged.push({ ...input });
  }
  const outputs: CalcMaterial[] = recipe.outputs.map((slot) => ({
    id: slot.id,
    kind: slotKind(slot),
    amount: slot.count && slot.count > 0 ? slot.count : 1,
    ...(slot.chance !== undefined ? { chance: slot.chance } : {}),
    ...(slot.kind === 'tag' ? { tagId: slot.id } : {}),
  }));
  const tier = recipeTier(recipe);
  return {
    recipeId: recipe.id,
    category: recipe.category ?? recipe.type,
    inputs: merged,
    outputs,
    ...(tier !== undefined ? { tier } : {}),
  };
}

export function recipeDivisor(
  recipe: CalcRecipe,
  materialId: string,
  kind: CalcKind,
): number {
  const amount = recipe.outputs
    .filter((out) => out.id === materialId && out.kind === kind)
    .reduce((sum, out) => sum + out.amount * (out.chance ?? 1), 0);
  return amount > 0 ? amount : 1;
}

