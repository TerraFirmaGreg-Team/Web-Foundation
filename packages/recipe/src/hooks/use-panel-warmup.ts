'use client';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useEffect } from 'react';
import { parseStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import {
  atlasPagePublicUrl,
  lookupSpriteInBundle,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import type {
  AtlasBundle,
  SpriteQuery,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import { loadStackDisplay } from '@terrafirmagreg-team/game/lib/entry/tooltip';
import type { ItemPanelCell } from '@terrafirmagreg-team/recipe/types';

const BATCH = 160;
const MAX_PAGES_CACHE = 6;

const prefetched = new Map<string, Set<string>>();

function idleStep(step: () => void) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(step, { timeout: 900 });
  } else {
    window.setTimeout(step, 32);
  }
}

function stackQuery(id: string, kind: SpriteQuery['kind']): SpriteQuery {
  const parsed = parseStackId(id);
  return {
    id: parsed.id,
    kind,
    ...(parsed.nbt !== undefined ? { tag: parsed.nbt } : {}),
  };
}

function cellQueries(cell: ItemPanelCell): SpriteQuery[] {
  switch (cell.kind) {
    case 'stack':
      return [stackQuery(cell.id, cell.ref === 'fluid' ? 'fluid' : 'item')];
    case 'group':
      return cell.members.map((id) => stackQuery(id, 'item'));
    case 'recipe': {
      const icon = cell.fav.icon;
      return icon ? [stackQuery(icon, 'item')] : [];
    }
  }
}

async function warmCells(
  dataset: DatasetRef,
  cells: ItemPanelCell[],
  seen: Set<string>,
) {
  const bundles = new Map<string, AtlasBundle | null>();
  for (const cell of cells) {
    for (const query of cellQueries(cell)) {
      const spriteId = query.id;
      if (!spriteId || spriteId.startsWith('#')) continue;
      const ns = spriteId.includes(':')
        ? spriteId.slice(0, spriteId.indexOf(':'))
        : '';
      if (!ns) continue;
      let bundle = bundles.get(ns);
      if (bundle === undefined) {
        bundle = await loadClientModAtlases(dataset, ns);
        bundles.set(ns, bundle);
      }
      const hit = lookupSpriteInBundle(bundle, query);
      const url = hit
        ? atlasPagePublicUrl(dataset, hit.atlas, hit.page)
        : undefined;
      if (url && !seen.has(url)) {
        seen.add(url);
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      }
      void loadStackDisplay(dataset, spriteId, query.kind).catch(() => {});
    }
  }
}

export function usePanelWarmup(
  dataset: DatasetRef,
  cells: ItemPanelCell[],
  page: number,
  pageSize: number,
) {
  useEffect(() => {
    if (!cells.length || pageSize <= 0) return;
    const key = datasetCacheKey(dataset);
    let seen = prefetched.get(key);
    if (!seen) {
      if (prefetched.size >= MAX_PAGES_CACHE) {
        prefetched.delete(prefetched.keys().next().value!);
      }
      seen = new Set();
      prefetched.set(key, seen);
    }
    let cancelled = false;
    const order = cells.map((_, i) => i);
    order.sort(
      (a, b) =>
        Math.abs(Math.floor(a / pageSize) - page) -
        Math.abs(Math.floor(b / pageSize) - page),
    );
    let cursor = 0;
    const step = () => {
      if (cancelled) return;
      const batch = order.slice(cursor, cursor + BATCH);
      cursor += BATCH;
      void warmCells(
        dataset,
        batch.map((i) => cells[i]!),
        seen,
      ).then(() => {
        if (!cancelled && cursor < order.length) idleStep(step);
      });
    };
    step();
    return () => {
      cancelled = true;
    };
  }, [dataset, cells, page, pageSize]);
}
