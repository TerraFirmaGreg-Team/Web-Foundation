'use client';

import { useEffect, useState } from 'react';
import { decodeCalcState } from '@terrafirmagreg-team/recipe/lib/calc/tree';
import {
  newCalcEntry,
  readCalcTabs,
  writeCalcTabs,
} from '@terrafirmagreg-team/recipe/lib/calc/storage';
import { recipeCalcHref } from '@terrafirmagreg-team/recipe/lib/links';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

export function useCalcShare({
  storageKey,
  dataset,
  incoming,
  version,
}: {
  storageKey: string;
  dataset: DatasetRef;
  incoming: string;
  version?: string;
}): { pending: boolean; failed: boolean } {
  const isShareId = incoming.startsWith('s');
  const [sharedTree, setSharedTree] = useState<string | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  useEffect(() => {
    if (!isShareId) return;
    let cancelled = false;
    const { id: datasetId, version: resolvedVersion } = dataset;
    void fetch(
      `/api/share/recipe/${encodeURIComponent(datasetId)}/${encodeURIComponent(incoming.slice(1))}${resolvedVersion ? `?version=${encodeURIComponent(resolvedVersion)}` : ''}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { tree?: unknown } | null) => {
        if (cancelled) return;
        if (typeof body?.tree === 'string') setSharedTree(body.tree);
        else setFetchFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isShareId, incoming, dataset]);
  const transport = isShareId ? sharedTree : incoming || null;
  const resolved = useResolvedLang();

  useEffect(() => {
    if (transport === null) return;
    const decoded = transport ? decodeCalcState(transport) : null;
    if (decoded) {
      const entry = newCalcEntry(decoded);
      writeCalcTabs(
        storageKey,
        [...readCalcTabs(storageKey), entry],
        entry.id,
      );
    }
    if (incoming && (decoded || !isShareId))
      replaceUrlState(recipeCalcHref(dataset, resolved, undefined, version));
  }, [transport, storageKey, dataset, resolved, incoming, version, isShareId]);

  return {
    pending: isShareId && sharedTree === null && !fetchFailed,
    failed:
      fetchFailed ||
      (transport !== null && !decodeCalcState(transport)),
  };
}
