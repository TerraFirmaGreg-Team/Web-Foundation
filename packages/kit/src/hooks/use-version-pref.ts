'use client';

import { useSyncExternalStore } from 'react';
import {
  jsonCodec,
  readStoredValue,
  subscribeStoredValue,
  writeStoredValue,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';

const STORAGE_KEY = 'tfg.dataset-versions';
const codec = jsonCodec<Record<string, string>>({});

export function setVersionPreference(datasetId: string, version?: string) {
  const next = { ...readStoredValue(STORAGE_KEY, codec.read) };
  if (version) next[datasetId] = version;
  else delete next[datasetId];
  writeStoredValue(STORAGE_KEY, next, codec.write);
}

export function useVersionPreference(datasetId?: string): string | undefined {
  return useSyncExternalStore(
    (onChange) => subscribeStoredValue(STORAGE_KEY, onChange),
    () =>
      datasetId
        ? readStoredValue(STORAGE_KEY, codec.read)[datasetId]
        : undefined,
    () => undefined,
  );
}

