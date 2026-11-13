import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { dumpStorageUrl } from './paths';
import type { DatasetRef, DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import type { ArtifactDescriptor, DatasetVersions, PublishedSnapshot, SnapshotIndex } from '../../types/snapshot';

export const DUMP_POINTER_TTL = 60_000;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid snapshot object');
  }
  return value as Record<string, unknown>;
}

export function snapshotPath(value: unknown): string {
  if (typeof value !== 'string' || !value || /[\\?#%:\s\u0000-\u001f]/.test(value) ||
    value.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid snapshot path: ${String(value)}`);
  }
  return value;
}

function segment(value: unknown): string {
  const path = snapshotPath(value);
  if (path.includes('/')) throw new Error(`Invalid snapshot segment: ${path}`);
  return path;
}

function revision(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error('Invalid snapshot revision');
  }
  return value;
}

export function snapshotRoot(ref: DatasetSnapshot): string {
  return `${segment(ref.id)}/${segment(ref.version)}/revisions/${revision(ref.revision)}`;
}

export type ResolvedSnapshot = DatasetSnapshot & { index: string };

export function snapshotStorageRoot(ref: DatasetSnapshot & { index?: string }): string {
  return ref.index?.endsWith('/objects.json.gz')
    ? ref.index.slice(0, -'/objects.json.gz'.length)
    : snapshotRoot(ref);
}

function resolvedSnapshot(
  ref: DatasetRef,
  version: string,
  published: PublishedSnapshot | undefined,
): ResolvedSnapshot {
  const base = { id: ref.id, version, revision: published?.revision ?? ref.revision! };
  return { ...base, index: published?.index ?? `${snapshotRoot(base)}/objects.json.gz` };
}

export function parseDatasetVersions(raw: unknown, id: string): DatasetVersions {
  segment(id);
  const row = record(raw);
  if (row.pack !== id) throw new Error(`Snapshot pack mismatch: ${id}`);
  if (!Array.isArray(row.versions)) throw new Error('Missing snapshot versions');
  const versions = row.versions.map(segment);
  if (new Set(versions).size !== versions.length) throw new Error('Duplicate snapshot versions');
  if (row.latest !== null && (typeof row.latest !== 'string' || !versions.includes(row.latest))) {
    throw new Error('Invalid latest snapshot version');
  }
  const source = record(row.snapshots);
  const snapshots: Record<string, PublishedSnapshot> = Object.create(null);
  if (Object.keys(source).some((version) => !versions.includes(version))) {
    throw new Error('Unlisted snapshot version');
  }
  for (const version of versions) {
    const item = record(source[version]);
    const rev = revision(item.revision);
    if (typeof item.publishedAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(item.publishedAt) ||
      !Number.isFinite(Date.parse(item.publishedAt)) ||
      new Date(item.publishedAt).toISOString().slice(0, 19) !== item.publishedAt.slice(0, 19)) {
      throw new Error('Invalid snapshot publishedAt');
    }
    const index = snapshotPath(item.index);
    const canonical = `${snapshotRoot({ id, version, revision: rev })}/objects.json.gz`;
    if (index !== canonical && !index.endsWith(`/${canonical}`)) {
      throw new Error('Invalid snapshot index path');
    }
    snapshots[version] = { revision: rev, publishedAt: item.publishedAt, index };
  }
  return { pack: id, latest: row.latest as string | null, versions, snapshots };
}

export function parseSnapshotIndex(raw: unknown): SnapshotIndex {
  const row = record(raw);
  const sourceFiles = record(row.files);
  const sourceArtifacts = record(row.artifacts);
  const files: Record<string, string> = Object.create(null);
  const artifacts: Record<string, ArtifactDescriptor> = Object.create(null);
  for (const [path, key] of Object.entries(sourceFiles)) {
    snapshotPath(path);
    files[path] = snapshotPath(key);
    const item = record(sourceArtifacts[path]);
    const sha256 = revision(item.sha256);
    if (typeof item.bytes !== 'number' || !Number.isSafeInteger(item.bytes) || item.bytes < 0) {
      throw new Error('Invalid artifact bytes');
    }
    if (item.codec !== 'json' && item.codec !== 'ndjson' && item.codec !== 'binary') {
      throw new Error('Invalid artifact codec');
    }
    if (item.compression !== 'gzip' && item.compression !== 'none') {
      throw new Error('Invalid artifact compression');
    }
    artifacts[path] = { sha256, bytes: item.bytes, codec: item.codec, compression: item.compression };
  }
  if (Object.keys(sourceArtifacts).some((path) => !Object.hasOwn(files, path))) {
    throw new Error('Artifact without file');
  }
  return { files, artifacts };
}

export const loadDatasetVersions = createAsyncCache(
  async (id: string): Promise<DatasetVersions | null> => {
    segment(id);
    const response = await fetch(dumpStorageUrl(`${id}/versions.json`), {
      cache: 'no-cache',
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Snapshot pointer fetch failed: ${id} (${response.status})`);
    return parseDatasetVersions(await response.json(), id);
  },
  (id) => id,
  DUMP_POINTER_TTL,
);

export function peekDatasetSnapshot(ref: DatasetRef): ResolvedSnapshot | undefined {
  segment(ref.id);
  if (ref.revision !== undefined) {
    if (!ref.version) throw new Error('Pinned revision requires a version');
    snapshotRoot(ref as DatasetSnapshot);
    return resolvedSnapshot(ref, ref.version, undefined);
  }
  const pointer = loadDatasetVersions.peek(ref.id);
  const version = ref.version ?? pointer?.latest;
  if (!version) return undefined;
  const published = pointer?.snapshots[version];
  return published ? resolvedSnapshot(ref, version, published) : undefined;
}

export async function resolveDatasetSnapshot(ref: DatasetRef): Promise<ResolvedSnapshot> {
  if (ref.revision !== undefined) return peekDatasetSnapshot(ref)!;
  const pointer = await loadDatasetVersions(ref.id);
  if (!pointer) throw new Error(`Snapshot pointer missing: ${ref.id}`);
  const version = ref.version ?? pointer.latest;
  if (!version || !Object.hasOwn(pointer.snapshots, version)) {
    throw new Error(`Unknown snapshot version: ${ref.id}/${version ?? ''}`);
  }
  return resolvedSnapshot(ref, version, pointer.snapshots[version]);
}
