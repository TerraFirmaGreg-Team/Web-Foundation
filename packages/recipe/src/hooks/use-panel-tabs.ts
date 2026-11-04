'use client';

import { createElement, useMemo } from 'react';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { panelTabRows } from '@terrafirmagreg-team/recipe/lib/panel';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';

export function usePanelTabs(
  index: RecipeCompactIndex | null,
  names: Record<string, Record<string, string>>,
  lang: Lang,
) {
  const t = useTranslations();
  return useMemo(
    () => [
      {
        id: '',
        icon: createElement(Entry, {
          id: 'minecraft:compass',
          kind: 'item',
          size: 'lg',
          href: false,
        }),
        help: t('All items', { note: 'recipe.all_items' }),
      },
      ...panelTabRows(index, names, lang).map((row) => ({
        id: row.id,
        icon: createElement(Entry, {
            ...(row.iconRef
              ? { reference: row.iconRef }
              : { id: row.icon, kind: 'item' as const }),
            size: 'lg',
            href: false,
          }),
        help: row.help,
      })),
    ],
    [index, lang, names, t],
  );
}

