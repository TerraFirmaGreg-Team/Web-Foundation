import {
  asNumber,
  asRecord,
  asStringList,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';

export function stringList(value: unknown): string[] {
  if (typeof value === 'string' && value) return [value];
  return asStringList(value);
}

export function numberList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const n = asNumber(item);
    return n === undefined ? [] : [n];
  });
}

export function mapEntries(
  value: unknown,
): [string, Record<string, unknown>][] {
  const row = asRecord(value);
  if (!row) return [];
  return Object.entries(row).flatMap(([key, item]) => {
    const entry = asRecord(item);
    return entry ? [[key, entry] as const] : [];
  });
}

