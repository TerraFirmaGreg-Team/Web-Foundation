'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { loadAllTagMembers } from '@terrafirmagreg-team/recipe/lib/client-index';

export function useTagMembers(
  dataset: DatasetRef,
  enabled: boolean,
): Record<string, string[]> | undefined {
  return useAsyncValue(
    enabled ? () => loadAllTagMembers(dataset) : false,
    [dataset, enabled],
  );
}

