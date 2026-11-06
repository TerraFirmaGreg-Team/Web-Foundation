import { asTaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asDumpTextList } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { bareId } from '@terrafirmagreg-team/guide/lib/nav/paths';

export type RawRecord = Record<string, unknown>;

export function numeric(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function compareGuideOrder(
  left: { id: string; order?: unknown },
  right: { id: string; order?: unknown },
) {
  const sort = numeric(left.order) - numeric(right.order);
  if (sort !== 0) return sort;
  return left.id.localeCompare(right.id);
}

export function rawId(raw: RawRecord, fallback: string) {
  return typeof raw.id === 'string' && raw.id ? raw.id : fallback;
}

export function stringField(
  raw: RawRecord | undefined,
  key: string,
): string | undefined {
  const value = raw?.[key];
  return typeof value === 'string' && value ? value : undefined;
}

export function displayRecord(
  raw: RawRecord | undefined,
): RawRecord | undefined {
  const display = raw?.display;
  return display && typeof display === 'object' && !Array.isArray(display)
    ? (display as RawRecord)
    : undefined;
}

export function urlSafeSlug(value: string): string {
  return value
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean)
    .join('-')
    .replace(/:/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function macrosFrom(
  raw: RawRecord | undefined,
): Record<string, string> | undefined {
  if (!raw?.macros || typeof raw.macros !== 'object') return undefined;
  const entries = Object.entries(raw.macros as RawRecord).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function asCover(value: unknown): TaggedReference | null {
  return asTaggedReference(value) ?? null;
}

export function asLanding(value: unknown): DumpText[] {
  return asDumpTextList(value) ?? [];
}

export function categoryMatches(
  categoryId: string,
  entryCategory: string | undefined,
) {
  if (!entryCategory) return false;
  return bareId(entryCategory) === bareId(categoryId);
}

