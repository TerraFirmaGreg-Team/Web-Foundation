'use client';
import { useMemo } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export function useSectionNames(): Record<
  string,
  { title: string; desc: string }
> {
  const t = useTranslations();
  return useMemo(
    () => ({
      docs: {
        title: t('Docs', { note: 'sections.docs' }),
        desc: t('Documentation', { note: 'sections.desc.docs' }),
      },
      changelog: {
        title: t('Changelog', { note: 'sections.changelog' }),
        desc: t('Release history and version notes', {
          note: 'sections.desc.changelog',
        }),
      },
      recipe: {
        title: t('Recipes', { note: 'sections.recipe' }),
        desc: t('Crafting and processing recipes', {
          note: 'sections.desc.recipe',
        }),
      },
      quest: {
        title: t('Quests', { note: 'sections.quest' }),
        desc: t('Quest chapters and objectives', { note: 'sections.desc.quest' }),
      },
      guide: {
        title: t('Guide', { note: 'sections.guide' }),
        desc: t('Gameplay guide', { note: 'sections.desc.guide' }),
      },
    }),
    [t],
  );
}

