'use client';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
  resolveDatasetRef,
  type DatasetVersionInfo,
  type DatasetRef,
} from '@terrafirmagreg-team/sites/location';
import { useVersionPreference } from '@terrafirmagreg-team/kit/hooks/use-version-pref';

const refs = new Map<string, DatasetRef | undefined>();

export function useVersionedDataset(
  id: string | undefined,
  info?: DatasetVersionInfo,
): DatasetRef | undefined {
  const param = useLocationSearchParams().get('version') ?? undefined;
  const preferred = useVersionPreference(id);
  const version = param ?? preferred;
  const key = `${id ?? ''} ${version ?? ''} ${info?.latest ?? ''} ${info?.versions?.join(',') ?? ''}`;
  if (!refs.has(key))
    refs.set(key, id ? resolveDatasetRef(id, version, info).ref : undefined);
  return refs.get(key);
}

