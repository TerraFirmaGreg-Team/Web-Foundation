'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { loadItemTooltips } from '@terrafirmagreg-team/recipe/lib/client-index';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function useItemTooltips(
  dataset: DatasetRef,
  lang: Lang,
  enabled: boolean,
): Record<string, string[]> | undefined {
  return useAsyncValue(
    enabled ? () => loadItemTooltips(dataset, lang) : false,
    [dataset, lang, enabled],
  );
}

