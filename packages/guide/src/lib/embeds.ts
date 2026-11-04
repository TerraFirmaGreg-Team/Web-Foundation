import { createConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { SectionEmbeds } from '@terrafirmagreg-team/kit/types/embeds';

export type {
  EmbedRecipe,
  EmbedRecipeCardProps,
  EmbedQuestLocation,
  SectionEmbeds,
} from '@terrafirmagreg-team/kit/types/embeds';

export const { register: registerGuideEmbeds, get: guideEmbeds } =
  createConfig<SectionEmbeds>('GuideEmbeds');
