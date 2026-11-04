import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import type { DumpRecipeLayout } from '@terrafirmagreg-team/recipe/lib/data/category/dto';

export function clientRecipeLayout(
  dataset: DatasetRef,
  categoryId: string,
): Promise<DumpRecipeLayout | undefined> {
  return loadDatasetRecipeCategories(dataset).then(
    (categories) =>
      categories.find((cat) => cat.id === categoryId)?.layout,
  );
}

