'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useCallback } from 'react';
import {
  createStoredValue,
  type StoredCodec,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';

const codec: StoredCodec<Record<string, number>> = {
  read: (raw) => {
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      const out: Record<string, number> = {};
      for (const [key, value] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        const page = Math.floor(Number(value));
        if (Number.isFinite(page) && page > 0) out[key] = page;
      }
      return out;
    } catch {
      return {};
    }
  },
  write: (value) => JSON.stringify(value),
};

const useStoredPanelPages = createStoredValue(
  'wiki.recipe.panelPage',
  codec,
);

export function usePanelPage(dataset: DatasetRef) {
  const [pages, setPages] = useStoredPanelPages();
  const refKey = `${dataset.id}/${dataset.version ?? ''}`;
  const setPage = useCallback(
    (page: number) => {
      setPages((prev) => {
        const next = page > 0 ? page : 0;
        if ((prev[refKey] ?? 0) === next) return prev;
        const copy = { ...prev };
        if (next > 0) copy[refKey] = next;
        else delete copy[refKey];
        return copy;
      });
    },
    [refKey, setPages],
  );
  return { page: pages[refKey] ?? 0, setPage };
}

