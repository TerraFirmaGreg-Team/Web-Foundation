import * as clientIndex from '@terrafirmagreg-team/recipe/lib/client-index';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import { loadClientManifest } from '@terrafirmagreg-team/dump/lib/dump/client/dump';

export function getRecipeSource() {
  return {
    ...clientIndex,
    categories: loadDatasetRecipeCategories,
    manifest: loadClientManifest,
  };
}

export type RecipeSource = ReturnType<typeof getRecipeSource>;
