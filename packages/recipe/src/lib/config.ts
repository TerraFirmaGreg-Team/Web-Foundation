import { createConfigRegistry, uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import { registerMdxComponents } from '@terrafirmagreg-team/mdx/components/mdx-components';
import { Recipe } from '@terrafirmagreg-team/recipe/components/mdx/recipe';
import '@terrafirmagreg-team/recipe/lib/preview';

export type RecipeConfigInput = {
  appName?: string;
};

const { register: registerRecipeConfig, get: recipeConfig } =
  createConfigRegistry<RecipeConfigInput, { appName: string }>((overrides) => ({
    appName: overrides.appName ?? uiConfig().brand?.name ?? '',
  }));

export { registerRecipeConfig, recipeConfig };

registerMdxComponents({ Recipe });

