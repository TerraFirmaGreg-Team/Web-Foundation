'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useMemo } from 'react';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { loadTagSlice } from '@terrafirmagreg-team/recipe/lib/client-index';
import { registryId } from '@terrafirmagreg-team/recipe/lib/lookup';
import { splitDumpId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';

const EMPTY_TAGS: { id: string; kind: string }[] = [];

export function useItemTagGroups({
  dataset,
  index,
  item,
  kind,
}: {
  dataset: DatasetRef;
  index: RecipeCompactIndex | null;
  item: string;
  kind: 'item' | 'fluid';
}) {
  const ids =
    useAsyncValue(async () => {
      const base = registryId(item);
      const ns = splitDumpId(base)?.ns;
      if (!index || !ns) return [] as { id: string; kind: string }[];
      const kinds = kind === 'item' ? ['item', 'block'] : [kind];
      const slices = await Promise.all(
        kinds.map((tagKind) => loadTagSlice(dataset, tagKind, ns)),
      );
      return slices.flatMap((slice, i) =>
        (slice[base] ?? slice[item] ?? []).map((id) => ({
          id,
          kind: kinds[i],
        })),
      );
    }, [dataset, index, item, kind]) ?? EMPTY_TAGS;
  const groups = useMemo(() => {
    const order = ['item', 'block', 'fluid'];
    const byKind = new Map<string, string[]>();
    for (const { id, kind: tagKind } of ids) {
      const list = byKind.get(tagKind);
      if (list) list.push(id);
      else byKind.set(tagKind, [id]);
    }
    return [...byKind.entries()].sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
    );
  }, [ids]);
  return { ids, groups };
}

