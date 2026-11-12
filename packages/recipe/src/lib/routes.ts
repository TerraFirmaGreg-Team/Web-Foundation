import { createSectionRoutes } from '@terrafirmagreg-team/kit/components/views/routes';
import { ogDeepLink } from '@terrafirmagreg-team/preview/server';
import {
  RecipePanelFeature,
  RecipeTreeFeature,
} from '@terrafirmagreg-team/recipe/components/views/layout';
import { RecipeAxisSwitcher } from '@terrafirmagreg-team/recipe/components/views/browser/axis-switcher';
import { recipeLanding } from '@terrafirmagreg-team/recipe/components/views/landing';
import { recipeTrees } from '@terrafirmagreg-team/recipe/components/tree';
import { getRecipeSource } from '@terrafirmagreg-team/recipe/lib/source';
import '@terrafirmagreg-team/recipe/lib/og';

export function recipeRoutes() {
  return createSectionRoutes({
    section: 'recipe',
    trees: recipeTrees,
    source: { getSource: getRecipeSource },
    layout: {
      treeFeature: RecipeTreeFeature,
      sidebar: { feature: RecipeAxisSwitcher },
      rightPanel: RecipePanelFeature,
    },
    landing: recipeLanding,
    deepLink: ogDeepLink('recipe'),
  });
}
