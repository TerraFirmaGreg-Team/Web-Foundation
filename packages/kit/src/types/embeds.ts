import type { ComponentType } from 'react';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type EmbedRecipe = {
  id: string;
  w?: number | null;
  inputs: { id: string }[];
  outputs: { id: string }[];
  slots?: Record<
    string,
    { id: string; alternatives?: { id: string }[] }
  >;
  widgets?: {
    type: string;
    id: string;
    alternatives?: string[];
  }[];
};

export type EmbedRecipeCardProps = {
  id: string;
  recipe: EmbedRecipe;
  dataset: DatasetRef;
  lang: Lang;
  langMap: Record<string, string>;
};

export type EmbedQuestLocation = { filename: string; questId: string };

export type SectionEmbeds = {
  quest?: {
    href(
      dataset: DatasetRef,
      lang: Lang | undefined,
      ref: { category: string; id: string },
    ): string;
    findLocation(
      dataset: DatasetRef,
      questId: string,
    ): Promise<EmbedQuestLocation | undefined>;
  };
  recipe?: {
    href(
      dataset: DatasetRef,
      lang: Lang | undefined,
      ref: { id: string },
    ): string;
    cardImageUrl(dataset: DatasetRef, id: string): string | undefined;
    load(dataset: DatasetRef, id: string): Promise<EmbedRecipe | undefined>;
    title(recipe: EmbedRecipe, langMap: Record<string, string>): string;
    Card: ComponentType<EmbedRecipeCardProps>;
  };
};
