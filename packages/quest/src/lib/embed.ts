import { findClientQuestLocation } from '@terrafirmagreg-team/quest/lib/client/quest';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import type { SectionEmbeds } from '@terrafirmagreg-team/kit/types/embeds';

export const questSectionEmbed: NonNullable<SectionEmbeds['quest']> = {
  href: (dataset, lang, ref) =>
    questHref(dataset, lang, { category: ref.category, id: ref.id }),
  findLocation: findClientQuestLocation,
};
