import { RecipeEmbedCard } from '@terrafirmagreg-team/recipe/components/embed-card';
import { loadClientRecipe } from '@terrafirmagreg-team/recipe/lib/client/recipe';
import {
  recipeCardImageUrl,
  recipeHref,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { registerSectionEmbed } from '@terrafirmagreg-team/kit/lib/embeds';
import type {
  EmbedRecipe,
  SectionEmbeds,
} from '@terrafirmagreg-team/kit/types/embeds';

export const recipeSectionEmbed: NonNullable<SectionEmbeds['recipe']> = {
  href: (dataset, lang, ref) => recipeHref(dataset, lang, { id: ref.id }),
  cardImageUrl: recipeCardImageUrl,
  load: async (dataset, id) =>
    (await loadClientRecipe(dataset, id)) as EmbedRecipe | undefined,
  title: (recipe, langMap) =>
    recipeTitle(recipe as unknown as Recipe, langMap),
  Card: RecipeEmbedCard,
};

registerSectionEmbed('recipe', recipeSectionEmbed);
