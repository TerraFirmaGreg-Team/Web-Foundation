'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { dumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';

export function useLangMap(
  dataset: DatasetRef | undefined,
  lang: string | undefined,
  enabled = true,
): Record<string, string> | undefined {
  const { value, pending } = useAsyncResult(
    enabled && dataset && lang
      ? () => dumpReader(dataset).then((reader) => reader.getLang(lang))
      : false,
    [dataset, lang, enabled],
  );
  return pending ? undefined : value;
}

