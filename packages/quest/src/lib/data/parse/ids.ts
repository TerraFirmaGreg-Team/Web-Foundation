import {
  asResourceKind,
  referenceKindFromResource,
} from '@terrafirmagreg-team/dump/lib/dump/contract/kind';
import { asRecord, asString, asStringList } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import {
  asTaggedReference,
  compactRefId,
  type ReferenceKind,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { parseFilterIds } from '@terrafirmagreg-team/quest/lib/data/filter';

function idsFromExact(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.includes('(') || trimmed.includes(' ')) return [];
  if (!trimmed.includes(':')) return [];
  return [trimmed];
}

export function itemIdsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(itemIdsFrom);
  const tagged = asTaggedReference(value);
  if (tagged) return [compactRefId(tagged) ?? tagged.id];
  if (typeof value === 'string') return idsFromExact(value);
  const row = asRecord(value);
  if (!row) return [];
  const id = asString(row.id);
  const filterItems = asStringList(row.filterItems);
  if (filterItems.length) return filterItems;
  const filter = asString(row.filter);
  if (filter) {
    const fromFilter = parseFilterIds(filter);
    if (fromFilter.length) return fromFilter;
  }
  if (id) return idsFromExact(id);
  return [];
}

export function refIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const filterItems = asStringList(asRecord(item)?.filterItems);
    if (filterItems.length) return filterItems;
    const filter = asString(asRecord(item)?.filter);
    if (filter) {
      const ids = parseFilterIds(filter);
      if (ids.length) return ids;
    }
    const id = compactRefId(item);
    return id ? [id] : [];
  });
}

export function iconKindFor(
  icon: string | undefined,
  iconRow: Record<string, unknown> | undefined,
): ReferenceKind | undefined {
  if (icon?.startsWith('#')) return 'itemTag';
  return (
    asTaggedReference(iconRow)?.kind ??
    referenceKindFromResource(asResourceKind(iconRow?.kind))
  );
}

