'use client';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
  type DatasetRef,
  parseSectionLocation,
  resolveDatasetRef,
} from '@terrafirmagreg-team/sites/location';
import type { SectionDataset } from '@terrafirmagreg-team/kit/types';

export function useCurrentDataset(
  datasets: readonly SectionDataset[],
): DatasetRef | undefined {
  const pathname = usePathname();
  const versionParam = useLocationSearchParams().get('version') ?? undefined;
  const { dataset } = parseSectionLocation(pathname);
  const meta = datasets.find((row) => row.id === dataset);
  return useMemo(
    () => dataset && meta ? resolveDatasetRef(dataset, versionParam, meta).ref : undefined,
    [dataset, versionParam, meta],
  );
}

