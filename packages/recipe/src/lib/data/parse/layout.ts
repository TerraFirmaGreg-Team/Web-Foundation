import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpRecipeLayout } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import type {
  Recipe,
  RecipeIngredient,
  RecipeWidget,
} from '@terrafirmagreg-team/recipe/lib/data/dto';
import {
  outputBoundary,
  slotIoRole,
} from '@terrafirmagreg-team/recipe/lib/data/slot-io';
import { tagKindFromRef } from './slots';

function recipeIo(
  recipe: Pick<Recipe, 'slots'>,
  layout?: DumpRecipeLayout,
): {
  inputs: RecipeIngredient[];
  outputs: RecipeIngredient[];
  catalysts: RecipeIngredient[];
} {
  const byId = new Map((layout?.slots ?? []).map((slot) => [slot.id, slot]));
  const boundary = outputBoundary(recipe.slots, layout);
  const inputs: RecipeIngredient[] = [];
  const outputs: RecipeIngredient[] = [];
  const catalysts: RecipeIngredient[] = [];
  for (const [slotId, fill] of Object.entries(recipe.slots)) {
    if (fill.type === 'renderOnly') continue;
    const laid = byId.get(slotId);
    const x = fill.x ?? laid?.x;
    const role = slotIoRole(fill.type, x, boundary);
    const y = fill.y ?? laid?.y;
    const ingredient: RecipeIngredient = {
      kind: fill.kind,
      id: fill.id,
      ...(fill.count !== undefined ? { count: fill.count } : {}),
      ...(fill.chance !== undefined ? { chance: fill.chance } : {}),
      ...(x !== undefined ? { x } : {}),
      ...(y !== undefined ? { y } : {}),
    };
    if (role === 'output') outputs.push(ingredient);
    else if (role === 'catalyst') catalysts.push(ingredient);
    else inputs.push(ingredient);
  }
  return { inputs, outputs, catalysts };
}

function positionedWidgets(
  recipe: Pick<Recipe, 'slots'>,
  covered: Set<string>,
): RecipeWidget[] {
  const out: RecipeWidget[] = [];
  for (const [slotId, fill] of Object.entries(recipe.slots)) {
    if (covered.has(slotId)) continue;
    if (fill.x === undefined || fill.y === undefined) continue;
    const tagKind = fill.kind === 'tag' ? tagKindFromRef(fill.ref) : undefined;
    out.push({
      type: 'slot',
      x: fill.x,
      y: fill.y,
      w: fill.w ?? 16,
      h: fill.h ?? 16,
      role: fill.type,
      kind: fill.kind,
      ...(tagKind && tagKind !== 'item' ? { tagKind } : {}),
      id: fill.id,
      ...(fill.count !== undefined && fill.count !== 1
        ? { count: fill.count }
        : {}),
      ...(fill.chance !== undefined ? { chance: fill.chance } : {}),
      ...(fill.alternatives?.length
        ? { alternatives: fill.alternatives.map(stackIdFromRef) }
        : {}),
    });
  }
  return out;
}

function widgetsFromLayout(
  recipe: Pick<Recipe, 'slots'>,
  layout: DumpRecipeLayout,
): RecipeWidget[] {
  const out: RecipeWidget[] = [];
  for (const slot of layout.slots) {
    const fill = recipe.slots[slot.id];
    if (!fill || fill.type === 'renderOnly') continue;
    const tagKind = fill.kind === 'tag' ? tagKindFromRef(fill.ref) : undefined;
    const pos =
      fill.x !== undefined && fill.y !== undefined
        ? { x: fill.x, y: fill.y, w: fill.w ?? 16, h: fill.h ?? 16 }
        : { x: slot.x, y: slot.y, w: slot.w, h: slot.h };
    out.push({
      type: 'slot',
      ...pos,
      role: fill.type,
      kind: fill.kind,
      ...(tagKind && tagKind !== 'item' ? { tagKind } : {}),
      id: fill.id,
      ...(fill.count !== undefined && fill.count !== 1
        ? { count: fill.count }
        : {}),
      ...(fill.chance !== undefined ? { chance: fill.chance } : {}),
      ...(fill.alternatives?.length
        ? { alternatives: fill.alternatives.map(stackIdFromRef) }
        : {}),
    });
  }
  return out;
}

export function hydrateRecipe(recipe: Recipe, layout?: DumpRecipeLayout): Recipe {
  const io = recipeIo(recipe, layout);
  return {
    ...recipe,
    type: recipe.category,
    inputs: io.inputs,
    outputs: io.outputs,
    widgets: [
      ...(layout ? widgetsFromLayout(recipe, layout) : []),
      ...positionedWidgets(
        recipe,
        new Set((layout?.slots ?? []).map((slot) => slot.id)),
      ),
      ...(recipe.widgets as RecipeWidget[]).filter(
        (widget) => widget.type !== 'slot',
      ),
    ],
    ...(layout
      ? {
          width: layout.w,
          height: layout.h,
          ...(layout.scale !== undefined ? { scale: layout.scale } : {}),
          ...(layout.margin !== undefined ? { margin: layout.margin } : {}),
        }
      : {}),
  };
}

