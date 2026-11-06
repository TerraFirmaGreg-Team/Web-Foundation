import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export type DumpLocation = {

  root: string;

  files?: Record<string, string>;
};

const store = globalThis as Record<symbol, unknown>;
const dumpLocations = (store[Symbol.for('terrafirmagreg.dump.locations')] ??=
  new Map<string, DumpLocation>()) as Map<string, DumpLocation>;
const dumpLocationListeners = (store[
  Symbol.for('terrafirmagreg.dump.locationListeners')
] ??= new Set<() => void>()) as Set<() => void>;

export function registerDumpLocation(
  dataset: DatasetRef,
  location: DumpLocation,
): void {
  dumpLocations.set(`${dataset.id}/${dataset.version ?? ''}`, location);
  for (const listener of dumpLocationListeners) listener();
}

export function subscribeDumpLocations(listener: () => void): () => void {
  dumpLocationListeners.add(listener);
  return () => dumpLocationListeners.delete(listener);
}

export function dumpLocation(dataset: DatasetRef): DumpLocation | undefined {
  return dumpLocations.get(`${dataset.id}/${dataset.version ?? ''}`);
}

export function dumpStorageUrl(storageRel: string): string {
  const origin = (
    process.env.NEXT_PUBLIC_DUMP_STORAGE_URL ??
    process.env.DUMP_STORAGE_URL ??
    ''
  ).replace(/\/+$/, '');
  if (!origin) {
    throw new Error(
      'NEXT_PUBLIC_DUMP_STORAGE_URL is not set: dump storage is required.',
    );
  }
  return `${origin}/${storageRel}`;
}

export function dumpPublicUrl(
  dataset: DatasetRef,
  ...segments: string[]
): string | undefined {
  const ds = cleanDumpSegment(dataset.id);
  if (!ds || ds.includes('/')) {
    throw new Error(`Invalid dump dataset segment: ${dataset.id}`);
  }
  const rel = segments
    .map(cleanDumpSegment)
    .filter((s): s is string => Boolean(s))
    .join('/');
  const loc = dumpLocation(dataset);
  if (!loc) return undefined;
  const key = rel ? loc.files?.[rel] : undefined;
  const storageRel = key ?? `${loc.root}${rel ? `/${rel}` : ''}`;
  return dumpStorageUrl(storageRel);
}

function cleanDumpSegment(segment: string): string | null {
  const cleaned = segment.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..')) return null;
  return cleaned;
}

export function cleanDumpRel(rel: string): string | null {
  return cleanDumpSegment(rel);
}

function dumpDirOf(rel: string): string {
  const cleaned = cleanDumpRel(rel) ?? '';
  const slash = cleaned.lastIndexOf('/');
  return slash >= 0 ? cleaned.slice(0, slash) : '';
}

export function joinDumpRel(
  baseFileRel: string,
  childRel: string,
): string | null {
  const child = cleanDumpRel(childRel);
  if (!child) return null;
  const dir = dumpDirOf(baseFileRel);
  return dir ? `${dir}/${child}` : child;
}

const TAG_REGISTRIES = ['items', 'blocks', 'fluids', 'entities'] as const;

export function tagHashId(tagId: string): string {
  return `#${tagId.replace(/^#+/, '')}`;
}

export function tagIdForms(tagId: string): string[] {
  const raw = tagId.startsWith('#') ? tagId.slice(1) : tagId;
  return [raw, `#${raw}`];
}

function tagRegistryKeys(
  tagId: string,
  preferredRegistry?: string,
): string[] {
  const raw = tagId.startsWith('#') ? tagId.slice(1) : tagId;
  const parts = splitDumpId(raw);
  if (!parts) return [];
  const registries = preferredRegistry
    ? [
        preferredRegistry,
        ...TAG_REGISTRIES.filter((registry) => registry !== preferredRegistry),
      ]
    : TAG_REGISTRIES;
  return registries.map((registry) => `${parts.ns}:${registry}/${parts.path}`);
}

export function matchTagIndexKey(
  entries: Record<string, unknown> | undefined,
  tagId: string,
  preferredRegistry?: string,
): string | undefined {
  if (!entries) return undefined;
  for (const form of tagIdForms(tagId)) {
    if (entries[form] !== undefined) return form;
  }
  for (const key of tagRegistryKeys(tagId, preferredRegistry)) {
    if (entries[key] !== undefined) return key;
  }
  const raw = tagId.startsWith('#') ? tagId.slice(1) : tagId;
  const parts = splitDumpId(raw);
  if (!parts) return undefined;
  const candidates = Object.keys(entries).filter(
    (key) => key.startsWith(`${parts.ns}:`) && key.endsWith(`/${parts.path}`),
  );
  return candidates.sort()[0];
}

export function splitDumpId(
  id: string,
): { ns: string; path: string } | undefined {
  const sep = id.indexOf(':');
  if (sep < 1) return undefined;
  const ns = id.slice(0, sep);
  const path = id
    .slice(sep + 1)
    .replaceAll('\\', '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+|\/+$/g, '');
  if (!ns || !path || ns.includes('/') || ns.includes('..') || path.includes('..')) {
    return undefined;
  }
  return { ns, path };
}

export function registryId(id: string): string {
  return stackIdBase(id);
}

export function tagPseudoId(tag: string, kind?: string): string {
  const raw = tagIdForms(tag)[0]!;
  const parts = splitDumpId(raw);
  return `emi:tag/${kind ?? 'item'}/${parts ? `${parts.ns}/${parts.path}` : raw}`;
}

export function dumpRelPublicUrl(
  dataset: DatasetRef,
  rel: string | null | undefined,
): string | undefined {
  const cleaned = typeof rel === 'string' ? cleanDumpRel(rel) : null;
  return cleaned ? dumpPublicUrl(dataset, cleaned) : undefined;
}

