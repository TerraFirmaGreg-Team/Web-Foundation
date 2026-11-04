'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { loadClientModNames } from '@terrafirmagreg-team/dump/lib/dump/client/mods';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function useRecipeModNames(
  dataset: DatasetRef | undefined,
  lang: Lang,
): Record<string, string> | undefined {
  return useAsyncValue(
    dataset ? () => loadClientModNames(dataset, lang) : undefined,
    [dataset, lang],
  );
}

