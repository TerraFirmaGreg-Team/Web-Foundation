'use client';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
  type DatasetRef,
  parseSectionLocation,
  resolveDatasetRef,
} from '@terrafirmagreg-team/sites/location';
import { useVersionPreference } from '@terrafirmagreg-team/kit/hooks/use-version-pref';
import type { SectionDataset } from '@terrafirmagreg-team/kit/types';

export function useCurrentDataset(
  datasets: readonly SectionDataset[],
): DatasetRef | undefined {
  const pathname = usePathname();
  const versionParam = useLocationSearchParams().get('version') ?? undefined;
  const { dataset } = parseSectionLocation(pathname);
  const meta = datasets.find((row) => row.id === dataset);
  const preferred = useVersionPreference(dataset);
  const version = versionParam ?? preferred;
  return useMemo(
    () => dataset && meta ? resolveDatasetRef(dataset, version, meta).ref : undefined,
    [dataset, version, meta],
  );
}

