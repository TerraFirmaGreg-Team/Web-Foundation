import type { FitDim } from '@terrafirmagreg-team/ui/hooks/page/use-fit-pages';
import type {
  RecipeCategory,
  RecipeCompactIndex,
  RecipeCompactRow,
} from '@terrafirmagreg-team/recipe/types';

export const FALLBACK_DIM: FitDim = { w: 320, h: 80 };

export function recipeCardDim(
  index: RecipeCompactIndex | null,
  categoriesById: Map<string, RecipeCategory>,
  row: RecipeCompactRow,
): FitDim {
  if (row.d) return { w: row.d.w, h: row.d.h };
  const typeId = index?.types[row.type];
  const layout = typeId ? categoriesById.get(typeId)?.layout : undefined;
  if (!layout) return FALLBACK_DIM;
  const scale = layout.scale ?? 2;
  const margin = layout.margin ?? 0;
  return {
    w: (layout.w + margin * 2) * scale,
    h: (layout.h + margin * 2) * scale,
  };
}

export function recipeCardFitDim(
  index: RecipeCompactIndex | null,
  categoriesById: Map<string, RecipeCategory>,
  row: RecipeCompactRow,
  box: FitDim,
): FitDim {
  const d = recipeCardDim(index, categoriesById, row);
  const fit = box.w > 0 && d.w > box.w ? box.w / d.w : 1;
  const w = d.w * fit;
  const h = d.h * fit;
  return h > box.h ? { w, h: box.h } : { w, h };
}
