import { gzipSync } from 'node:zlib';
import { AwsClient } from 'aws4fetch';
import {
  initAdvancedSearch,
  type AdvancedIndex,
} from 'fumadocs-core/search/server';
import { datasetCacheKey, resolveDatasetRef, type DatasetRef, type DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import { loadDatasetVersions, resolveDatasetSnapshot, snapshotStorageRoot } from './dump/snapshot';
import { dumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { parseDumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/parse';
import { dumpIndexFromManifest } from '@terrafirmagreg-team/dump/lib/dump/mods/index';
import type { DumpIndex } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';
import type { DumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';

export interface DumpSearchBlob {
  type: 'i18n';
  data: Record<string, unknown>;
}

export type DumpSearchSource = {
  getJson(rel: string): Promise<unknown | undefined>;
};

export type DumpSearchIndexBuilder = (
  dataset: DatasetRef,
  dump: DumpIndex,
  source: DumpSearchSource,
) => Promise<(AdvancedIndex & { locale: string })[]>;

export async function resolveDumpVersion(
  id: string,
  version: string | undefined,
): Promise<string | undefined> {
  if (version) return version;
  return (await loadDatasetVersions(id))?.latest ?? undefined;
}

export async function buildDumpSearchBlob(
  id: string,
  version: string | undefined,
  lang: string,
  indexBuilders: DumpSearchIndexBuilder[],
): Promise<DumpSearchBlob> {
  const [dataset, info] = await Promise.all([
    resolveDatasetSnapshot({ id, version }),
    loadDatasetVersions(id),
  ]);
  return buildSnapshotSearchBlob(
    dataset,
    resolveDatasetRef(id, version, info ?? undefined).ref.version,
    lang,
    indexBuilders,
  );
}

async function buildSnapshotSearchBlob(
  dataset: DatasetSnapshot,
  pin: string | undefined,
  lang: string,
  indexBuilders: DumpSearchIndexBuilder[],
): Promise<DumpSearchBlob> {
  const reader = await dumpReader(dataset);
  const manifest = parseDumpManifest(
    await reader.getJson('manifest.json'),
  ) as DumpManifest | null;
  if (!manifest) return { type: 'i18n', data: {} };
  const dump = dumpIndexFromManifest(manifest, snapshotStorageRoot(dataset));
  const pinned: DatasetRef = { ...dataset, pin };
  const indexes = (
    await Promise.all(
      indexBuilders.map((build) => build(pinned, dump, reader)),
    )
  ).flat();
  const scoped = indexes.filter((index) => index.locale === lang);
  if (!scoped.length) return { type: 'i18n', data: {} };
  const blob = await initAdvancedSearch({
    indexes: scoped,
    localeFilter: true,
  }).export();
  return { type: 'i18n', data: { [lang]: blob } };
}

const builds = new Map<string, Promise<DumpSearchBlob>>();

export async function buildDumpSearchBlobCached(
  id: string,
  version: string | undefined,
  lang: string,
  indexBuilders: DumpSearchIndexBuilder[],
): Promise<DumpSearchBlob> {
  const [dataset, info] = await Promise.all([
    resolveDatasetSnapshot({ id, version }),
    loadDatasetVersions(id),
  ]);
  const key = datasetCacheKey(dataset, lang);
  const cached = builds.get(key);
  if (cached) return cached;
  const p = buildSnapshotSearchBlob(
    dataset,
    resolveDatasetRef(id, version, info ?? undefined).ref.version,
    lang,
    indexBuilders,
  );
  p.catch(() => {
    if (builds.get(key) === p) builds.delete(key);
  });
  builds.set(key, p);
  return p;
}

function s3Client(): AwsClient | undefined {
  const accessKeyId = process.env.DUMP_S3_ACCESS_KEY;
  const secretAccessKey = process.env.DUMP_S3_SECRET_KEY;
  if (!accessKeyId || !secretAccessKey) return undefined;
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: process.env.DUMP_S3_REGION ?? 'auto',
    service: 's3',
  });
}

export function searchBlobKey(
  snapshot: DatasetSnapshot & { index?: string },
  lang: string,
): string {
  return `${snapshotStorageRoot(snapshot)}/search/${lang}.json`;
}

export async function putSearchBlob(
  snapshot: DatasetSnapshot & { index?: string },
  lang: string,
  blob: unknown,
): Promise<boolean> {
  const aws = s3Client();
  const endpoint = process.env.DUMP_S3_ENDPOINT;
  const bucket = process.env.DUMP_S3_BUCKET;
  if (!aws || !endpoint || !bucket) return false;
  const key = searchBlobKey(snapshot, lang);
  const url = `${endpoint.replace(/\/+$/, '')}/${bucket}/${key}`;
  const res = await aws.fetch(url, {
    method: 'PUT',
    body: gzipSync(JSON.stringify(blob)),
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
  return res.ok;
}
