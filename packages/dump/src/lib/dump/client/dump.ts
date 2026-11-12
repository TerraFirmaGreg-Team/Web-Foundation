import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { dumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { DUMP_POINTER_TTL } from '@terrafirmagreg-team/dump/lib/dump/json-reader';
import { dumpRelPublicUrl, splitDumpId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import {
  asRecord,
  resolveEdgeRowEntries,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import {
  modelPublicUrl,
  texturePublicUrl,
} from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { yieldToMain } from '@terrafirmagreg-team/data/lib/scheduler';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import {
  dumpModRegistryRel,
  dumpRegistryIconsRel,
  dumpRegistryNamespaces,
  dumpRegistryRel,
  dumpRegistryTooltipsRel,
  dumpRegistryUsesRel,
} from '@terrafirmagreg-team/dump/lib/dump/mods/index';
import type { DumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';

export function loadClientManifest(
  dataset: DatasetRef,
): Promise<DumpManifest | null> {
  return loadDatasetDump(dataset).then((dump) => dump?.manifest ?? null);
}

export type DatasetVersions = { latest?: string; versions: string[] };

export const loadClientVersions = createAsyncCache(
  async (datasetId: string): Promise<DatasetVersions | null> => {
    const reader = await dumpReader({ id: datasetId });
    const raw = await reader.getJson('versions.json');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const row = raw as Record<string, unknown>;
    const versions = Array.isArray(row.versions)
      ? row.versions.filter((v): v is string => typeof v === 'string')
      : [];
    if (!versions.length) return null;
    return {
      latest: typeof row.latest === 'string' ? row.latest : undefined,
      versions,
    };
  },
  undefined,
  DUMP_POINTER_TTL,
);

export function clientDumpJson(
  dataset: DatasetRef,
  rel: string | null | undefined,
  priority?: 'high',
): Promise<unknown | undefined> {
  if (!rel) return Promise.resolve(undefined);
  return dumpReader(dataset).then((reader) => reader.getJson(rel, priority));
}

export async function clientRegistryEntries(
  dataset: DatasetRef,
  file: string,
  priority?: 'high',
): Promise<Record<string, unknown> | undefined> {
  const dump = await loadDatasetDump(dataset);
  const rel = dumpRegistryRel(dump, file);
  if (rel) return asRecord(await clientDumpJson(dataset, rel, priority));
  const namespaces = dumpRegistryNamespaces(dump, file);
  if (!namespaces.length) return undefined;
  const shards = await Promise.all(
    namespaces.map((ns) =>
      clientDumpJson(dataset, `registry/${file}/${ns}.ndjson`, priority),
    ),
  );
  const out: Record<string, unknown> = {};
  let processed = 0;
  for (const shard of shards) {
    const map = asRecord(shard);
    if (!map) continue;
    for (const [key, row] of resolveEdgeRowEntries(map)) {
      out[key] = row;
      if (++processed % 8000 === 0) await yieldToMain();
    }
  }
  return out;
}

export async function clientRegistryNsEntries(
  dataset: DatasetRef,
  file: string,
  ns: string,
  priority?: 'high',
): Promise<Record<string, unknown> | undefined> {
  const rel = dumpModRegistryRel(
    await loadDatasetDump(dataset),
    ns,
    file,
  );
  return rel
    ? asRecord(await clientDumpJson(dataset, rel, priority))
    : undefined;
}

export async function clientRegistryIconsEntries(
  dataset: DatasetRef,
  file: string,
  ns: string,
  priority?: 'high',
): Promise<Record<string, unknown> | undefined> {
  const rel = dumpRegistryIconsRel(
    await loadDatasetDump(dataset),
    ns,
    file,
  );
  return rel
    ? asRecord(await clientDumpJson(dataset, rel, priority))
    : undefined;
}

export async function clientRegistryTooltipsEntries(
  dataset: DatasetRef,
  file: string,
  ns: string,
  priority?: 'high',
): Promise<Record<string, unknown> | undefined> {
  const rel = dumpRegistryTooltipsRel(
    await loadDatasetDump(dataset),
    ns,
    file,
  );
  return rel
    ? asRecord(await clientDumpJson(dataset, rel, priority))
    : undefined;
}

export async function clientRegistryUsesEntries(
  dataset: DatasetRef,
  file: string,
  ns: string,
  priority?: 'high',
): Promise<Record<string, unknown> | undefined> {
  const rel = dumpRegistryUsesRel(
    await loadDatasetDump(dataset),
    ns,
    file,
  );
  return rel
    ? asRecord(await clientDumpJson(dataset, rel, priority))
    : undefined;
}

export function clientDumpLang(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return dumpReader(dataset).then((reader) => reader.getLang(lang));
}

export function clientDumpLangRaw(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return dumpReader(dataset).then((reader) => reader.getLangRaw(lang));
}

export function clientDumpNames(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return dumpReader(dataset).then((reader) => reader.getNames(lang));
}

export async function clientRegistryDataFileRel(
  dataset: DatasetRef,
  ns: string,
  file: string,
): Promise<string | undefined> {
  return dumpModRegistryRel(await loadDatasetDump(dataset), ns, file);
}

function stackNs(id: string): string | undefined {
  const ns = stackIdBase(id).split(':', 1)[0];
  return ns || undefined;
}

export function clientTagFileRel(
  dataset: DatasetRef,
  tagId: string,
): Promise<string | undefined> {
  const ns = stackNs(tagId.startsWith('#') ? tagId.slice(1) : tagId);
  return ns
    ? clientRegistryDataFileRel(dataset, ns, 'tags')
    : Promise.resolve(undefined);
}

export function dumpTextureUrl(
  dataset: DatasetRef,
  textureId: string,
): string | undefined {
  return texturePublicUrl(dataset, textureId);
}

export async function multiblockModelIndex(
  dataset: DatasetRef,
  namespace: string,
): Promise<unknown | undefined> {
  return (
    (await clientDumpJson(
      dataset,
      `assets/${namespace}/models/multiblock.json`,
    )) ??
    (await clientDumpJson(
      dataset,
      `data/${namespace}/models/multiblock.json`,
    ))
  );
}

export async function dumpModelUrl(
  dataset: DatasetRef,
  modelId: string,
): Promise<string | undefined> {
  const parts = splitDumpId(modelId.trim());
  if (!parts) return undefined;
  const index = await multiblockModelIndex(dataset, parts.ns);
  const rel =
    index && typeof index === 'object' && !Array.isArray(index)
      ? (index as Record<string, unknown>)[modelId]
      : undefined;
  return modelPublicUrl(
    dataset,
    parts.ns,
    typeof rel === 'string' ? rel : undefined,
  );
}

export { dumpRelPublicUrl };

