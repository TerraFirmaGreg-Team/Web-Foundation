import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import type { DumpRecipeLayout } from '@terrafirmagreg-team/recipe/lib/data/category/dto';

export function clientRecipeLayout(
  dataset: DatasetRef,
  categoryId: string,
): Promise<DumpRecipeLayout | undefined> {
  return loadDatasetRecipeCategories(dataset).then((categories) => {
    const cat = categories.find((item) => item.id === categoryId);
    return cat?.layout
      ? { ...cat.layout, workstations: cat.workstations }
      : undefined;
  });
}

