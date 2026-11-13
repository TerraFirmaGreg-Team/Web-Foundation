'use client';

import { useSyncExternalStore } from 'react';
import {
  dumpStatusSnapshot,
  subscribeDumpStatus,
  type DumpStatusSnapshot,
} from '@terrafirmagreg-team/data/lib/dump-status';

const SERVER_SNAPSHOT: DumpStatusSnapshot = {
  statuses: {},
  retryNonce: 0,
  dismissed: false,
};

export function useDumpStatus(): DumpStatusSnapshot {
  return useSyncExternalStore(
    subscribeDumpStatus,
    dumpStatusSnapshot,
    () => SERVER_SNAPSHOT,
  );
}

export function useDumpRetryNonce(): number {
  return useDumpStatus().retryNonce;
}

export function useFailedDatasets(): string[] {
  return Object.entries(useDumpStatus().statuses)
    .filter(([, state]) => state.status === 'failed')
    .map(([id]) => id);
}

export function isDatasetFailed(
  failed: readonly string[],
  dataset: { id: string; version?: string },
): boolean {
  const prefix = JSON.stringify(
    dataset.version !== undefined
      ? [dataset.id, dataset.version]
      : [dataset.id],
  ).slice(0, -1);
  return failed.some(
    (key) => key === dataset.id || key.startsWith(prefix),
  );
}
