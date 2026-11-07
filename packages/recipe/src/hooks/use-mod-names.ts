'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useDumpRetryNonce } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { loadClientModNames } from '@terrafirmagreg-team/dump/lib/dump/client/mods';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function useRecipeModNames(
  dataset: DatasetRef | undefined,
  lang: Lang,
): { value: Record<string, string> | undefined; pending: boolean } {
  const nonce = useDumpRetryNonce();
  return useAsyncResult(
    dataset ? () => loadClientModNames(dataset, lang) : undefined,
    [dataset, lang, nonce],
  );
}
