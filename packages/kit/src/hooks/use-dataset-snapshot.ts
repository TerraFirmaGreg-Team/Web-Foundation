'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import {
  datasetSnapshots,
  serverDatasetSnapshot,
} from '@terrafirmagreg-team/kit/lib/dataset-snapshots';

export function useDatasetSnapshot(selection: DatasetRef) {
  const { id, version } = selection;
  const ref = useMemo(() => ({ id, version }), [id, version]);
  const state = useSyncExternalStore(
    useCallback((listener) => datasetSnapshots.subscribe(ref, listener), [ref]),
    useCallback(() => datasetSnapshots.get(ref), [ref]),
    serverDatasetSnapshot,
  );
  const retry = useCallback(() => datasetSnapshots.retry(ref), [ref]);
  const confirm = useCallback(() => datasetSnapshots.confirm(ref), [ref]);
  return { ...state, retry, confirm };
}

export function useActiveDatasetSnapshot(selection: DatasetRef | undefined) {
  const id = selection?.id;
  const version = selection?.version;
  const ref = useMemo(() => id ? { id, version } : undefined, [id, version]);
  return useSyncExternalStore(
    useCallback(
      (listener) => ref ? datasetSnapshots.watch(ref, listener) : () => {},
      [ref],
    ),
    useCallback(() => ref ? datasetSnapshots.get(ref).active : undefined, [ref]),
    () => undefined,
  );
}
