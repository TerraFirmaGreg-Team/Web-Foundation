import {
  asBool,
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type {
  QuestReward,
  QuestTask,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import { iconKindFor, itemIdsFrom, refIds } from './ids';

function taskFilter(row: Record<string, unknown>): string | undefined {
  const own = asString(row.filter);
  if (own) return own;
  const refFilter = asString(asRecord(row.ref)?.filter);
  if (refFilter) return refFilter;
  const itemFilter = asString(asRecord(row.item)?.filter);
  if (itemFilter) return itemFilter;
  if (Array.isArray(row.items)) {
    for (const item of row.items) {
      const nested = asString(asRecord(item)?.filter);
      if (nested) return nested;
    }
  }
  return undefined;
}

export function parseTask(
  row: Record<string, unknown>,
  key: string,
): QuestTask | undefined {
  const type = asString(row.type) ?? 'unknown';
  const ref = asTaggedReference(row.ref);
  const items = [...refIds(row.items), ...itemIdsFrom(row.item)];
  const iconRow = asRecord(row.icon);
  const icon =
    itemIdsFrom(row.icon)[0] ?? asString(row.icon) ?? asString(iconRow?.id);
  return {
    id: asString(row.id) ?? key,
    type,
    title: asString(row.title),
    items: [...new Set(items)],
    ref,
    count: asNumber(row.count),
    optional: asBool(row.optional),
    dimension: asString(row.dimension),
    stage: asString(row.stage),
    biome: asString(row.biome),
    filter: taskFilter(row),
    filterRaw: asString(row.filterRaw),
    itemFilter: asString(row.itemFilter),
    icon,
    iconKind: iconKindFor(icon, iconRow),
  };
}

export function parseReward(
  row: Record<string, unknown>,
  key: string,
): QuestReward | undefined {
  const ref = asTaggedReference(row.ref);
  const items = [...refIds(row.items), ...itemIdsFrom(row.item)];
  return {
    id: asString(row.id) ?? key,
    type: asString(row.type) ?? 'unknown',
    title: asString(row.title),
    items: [...new Set(items)],
    ref,
    count: asNumber(row.count),
    xp: asNumber(row.xp),
  };
}

