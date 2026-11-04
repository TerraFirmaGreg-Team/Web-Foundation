'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useSyncExternalStore } from 'react';
import {
  dumpLocation,
  subscribeDumpLocations,
  type DumpLocation,
} from '@terrafirmagreg-team/dump/lib/dump/paths';

export function useDumpLocation(
  dataset: DatasetRef | undefined,
): DumpLocation | undefined {
  return useSyncExternalStore(
    subscribeDumpLocations,
    () => (dataset ? dumpLocation(dataset) : undefined),
    () => undefined,
  );
}

