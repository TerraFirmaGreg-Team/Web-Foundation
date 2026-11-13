'use client';
import { usePathname } from 'next/navigation';
import {
  type DatasetRef,
  parseSectionLocation,
} from '@terrafirmagreg-team/sites/location';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import type { SectionDataset } from '@terrafirmagreg-team/kit/types';
import { useActiveDatasetSnapshot } from '@terrafirmagreg-team/kit/hooks/use-dataset-snapshot';

export function useCurrentDataset(
  datasets: readonly SectionDataset[],
): DatasetRef | undefined {
  const pathname = usePathname();
  const { dataset } = parseSectionLocation(pathname);
  const meta = datasets.find((row) => row.id === dataset);
  const selection = useVersionedDataset(meta?.id, meta);
  const snapshot = useActiveDatasetSnapshot(selection);
  return snapshot && selection ? { ...snapshot, pin: selection.version } : selection;
}
