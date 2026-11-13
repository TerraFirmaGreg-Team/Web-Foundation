import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { dumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { loadDatasetVersions } from '@terrafirmagreg-team/dump/lib/dump/snapshot';
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
import { yieldToMain } from '@terrafirmagreg-team/data/lib/scheduler';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import {
  dumpModRegistryRel,
  dumpRegistryNamespaces,
  dumpRegistryRel,
  dumpRegistryTooltipsRel,
  dumpRegistryUsesRel,
  SHARDED_REGISTRY,
} from '@terrafirmagreg-team/dump/lib/dump/mods/index';
import type { DumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';

export function loadClientManifest(
  dataset: DatasetRef,
): Promise<DumpManifest | null> {
  return loadDatasetDump(dataset).then((dump) => dump?.manifest ?? null);
}

export type { DatasetVersions } from '../../../types/snapshot';

export const loadClientVersions = loadDatasetVersions;

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
  if (SHARDED_REGISTRY.has(file)) {
    const merged = asRecord(
      await clientDumpJson(dataset, `registry/${file}.ndjson`, priority),
    );
    if (merged) return merged;
  }
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

export async function clientRegistryIconEntry(
  dataset: DatasetRef,
  file: string,
  id: string,
): Promise<unknown | undefined> {
  const reader = await dumpReader(dataset);
  for await (const batch of reader.ndjsonRows(
    `registry/${file}.icons.ndjson`,
  )) {
    for (const [key, value] of batch) {
      if (key === id) return value;
    }
  }
  return undefined;
}

export async function clientRegistryIconsMerged(
  dataset: DatasetRef,
  file: string,
  priority?: 'high',
): Promise<Record<string, unknown> | undefined> {
  return asRecord(
    await clientDumpJson(dataset, `registry/${file}.icons.ndjson`, priority),
  );
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

export type DumpLangPart = 'names' | 'recipe' | 'quest' | 'guide';

async function clientDumpLangPart(
  dataset: DatasetRef,
  lang: string,
  part: DumpLangPart,
): Promise<Record<string, string>> {
  return (
    (asRecord(
      await clientDumpJson(dataset, `lang/${lang}.${part}.ndjson`),
    ) as Record<string, string> | undefined) ?? {}
  );
}

export function clientDumpLangNames(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return clientDumpLangPart(dataset, lang, 'names');
}

export function clientDumpLangRecipe(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return clientDumpLangPart(dataset, lang, 'recipe');
}

export function clientDumpLangQuest(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return clientDumpLangPart(dataset, lang, 'quest');
}

export function clientDumpLangGuide(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return clientDumpLangPart(dataset, lang, 'guide');
}

export async function clientDumpLangMissing(
  dataset: DatasetRef,
  lang: string,
  part: DumpLangPart,
): Promise<Set<string>> {
  const rows = await clientDumpJson(
    dataset,
    `lang/${lang}.${part}.missing.json`,
  );
  return new Set(Array.isArray(rows) ? (rows as string[]) : []);
}

export function clientDumpLangGuideMissing(
  dataset: DatasetRef,
  lang: string,
): Promise<Set<string>> {
  return clientDumpLangMissing(dataset, lang, 'guide');
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
  return clientDumpJson(
    dataset,
    `assets/${namespace}/models/multiblock.json`,
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
