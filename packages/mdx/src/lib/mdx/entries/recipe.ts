import { createEntryRemark } from './factory.ts';

export const remarkRecipeEntry = createEntryRemark({
  directive: 'recipe',
  component: 'RecipeEntry',
});
