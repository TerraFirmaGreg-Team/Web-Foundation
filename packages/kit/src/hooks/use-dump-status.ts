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
