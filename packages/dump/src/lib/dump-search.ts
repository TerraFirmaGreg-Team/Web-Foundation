import { gzipSync } from 'node:zlib';
import { AwsClient } from 'aws4fetch';
import {
  initAdvancedSearch,
  type AdvancedIndex,
} from 'fumadocs-core/search/server';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
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
  getLang(lang: string): Promise<Record<string, string>>;
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
  const reader = await dumpReader({ id });
  const versions = (await reader.getJson('versions.json')) as
    | { latest?: string }
    | undefined;
  return versions?.latest;
}

export async function buildDumpSearchBlob(
  id: string,
  version: string | undefined,
  lang: string,
  indexBuilders: DumpSearchIndexBuilder[],
): Promise<DumpSearchBlob> {
  const ver = await resolveDumpVersion(id, version);
  if (!ver) return { type: 'i18n', data: {} };
  const reader = await dumpReader({ id, version: ver });
  const manifest = parseDumpManifest(
    await reader.getJson('manifest.json'),
  ) as DumpManifest | null;
  if (!manifest) return { type: 'i18n', data: {} };
  const dataset = { id, version: ver };
  const dump = dumpIndexFromManifest(manifest, `${id}/${ver}`);
  const indexes = (
    await Promise.all(
      indexBuilders.map((build) => build(dataset, dump, reader)),
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

export function buildDumpSearchBlobCached(
  id: string,
  version: string | undefined,
  lang: string,
  indexBuilders: DumpSearchIndexBuilder[],
): Promise<DumpSearchBlob> {
  const key = `${id}/${version ?? ''}/${lang}`;
  const cached = builds.get(key);
  if (cached) return cached;
  const p = buildDumpSearchBlob(id, version, lang, indexBuilders);
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

export async function putSearchBlob(
  id: string,
  version: string,
  lang: string,
  blob: unknown,
): Promise<boolean> {
  const aws = s3Client();
  const endpoint = process.env.DUMP_S3_ENDPOINT;
  const bucket = process.env.DUMP_S3_BUCKET;
  if (!aws || !endpoint || !bucket) return false;
  const key = `${id}/${version}/search/${lang}.json`;
  const url = `${endpoint.replace(/\/+$/, '')}/${bucket}/${key}`;
  const res = await aws.fetch(url, {
    method: 'PUT',
    body: gzipSync(JSON.stringify(blob)),
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip',
      'Cache-Control': 'public, max-age=3600',
    },
  });
  return res.ok;
}

