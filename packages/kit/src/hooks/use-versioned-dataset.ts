'use client';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
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
  if (!refs.has(key)) {
    const selectedVersion =
      version &&
      version !== (info?.latest ?? info?.versions?.[0]) &&
      (!info?.versions?.length || info.versions.includes(version))
        ? version
        : undefined;
    refs.set(key, id ? { id, version: selectedVersion } : undefined);
  }
  return refs.get(key);
}
