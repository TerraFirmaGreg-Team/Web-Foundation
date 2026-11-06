import type { Recipe, RecipeSlotWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';

export function recipeSlots(recipe: Recipe): RecipeSlotWidget[] {
  return recipe.widgets.filter(
    (widget): widget is RecipeSlotWidget => widget.type === 'slot',
  );
}

