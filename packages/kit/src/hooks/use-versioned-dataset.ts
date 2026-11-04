'use client';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
  resolveDatasetRef,
  type DatasetVersionInfo,
  type DatasetRef,
} from '@terrafirmagreg-team/sites/location';

const refs = new Map<string, DatasetRef | undefined>();

export function useVersionedDataset(
  id: string | undefined,
  info?: DatasetVersionInfo,
): DatasetRef | undefined {
  const version = useLocationSearchParams().get('version') ?? undefined;
  const key = `${id ?? ''} ${version ?? ''} ${info?.latest ?? ''} ${info?.versions?.join(',') ?? ''}`;
  if (!refs.has(key))
    refs.set(key, id ? resolveDatasetRef(id, version, info).ref : undefined);
  return refs.get(key);
}

