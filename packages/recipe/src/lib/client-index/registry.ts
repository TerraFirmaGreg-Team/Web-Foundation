import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { clientRegistryNsEntries } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadClientTagMembers } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import {
  asRecord,
  asStringList,
  resolveEdgeRows,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

const REGISTRY_FIELD: Record<
  string,
  'items' | 'blocks' | 'fluids' | 'entities'
> = {
  item: 'items',
  block: 'blocks',
  fluid: 'fluids',
  entity: 'entities',
};

function registryField(kind: string) {
  return REGISTRY_FIELD[kind] ?? 'items';
}

const registrySliceCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    kind: string,
    ns: string,
  ): Promise<Record<string, Record<string, unknown>>> => {
    const field = registryField(kind);
    const raw = await clientRegistryNsEntries(dataset, field, ns, 'high');
    const map = asRecord(raw);
    return map ? resolveEdgeRows(map) : {};
  },
);

export async function loadRegistryEntrySlice(
  dataset: DatasetRef,
  kind: string,
  id: string,
): Promise<Record<string, unknown> | undefined> {
  const base = stackIdBase(id);
  const ns = base.includes(':') ? base.split(':', 1)[0] : 'minecraft';
  const map = await registrySliceCache(dataset, kind, ns);
  return map[id] ?? map[base];
}

const tagSliceCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    kind: string,
    ns: string,
  ): Promise<Record<string, string[]>> => {
    const prefix = `${ns}:`;
    const map = await registrySliceCache(dataset, kind, ns);
    const out: Record<string, string[]> = {};
    for (const [id, entry] of Object.entries(map)) {
      if (!id.startsWith(prefix)) continue;
      const tags = asStringList(entry.tags);
      if (tags.length) out[id] = tags;
    }
    return out;
  },
);

export function loadTagSlice(
  dataset: DatasetRef,
  kind: string,
  ns: string,
): Promise<Record<string, string[]>> {
  return tagSliceCache(dataset, kind, ns);
}

const tagMembersByKindCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    kind: string,
  ): Promise<Record<string, string[]>> => {
    const memberKind = registryField(kind) === 'blocks' ? 'block' : 'item';
    return (await loadClientTagMembers(dataset, memberKind)) ?? {};
  },
  (dataset, kind) =>
    `${dataset.id}/${dataset.version ?? ''} ${registryField(kind) === 'blocks' ? 'block' : 'item'}`,
);

const allTagMembersCache = createDatasetCache(
  async (dataset: DatasetRef): Promise<Record<string, string[]>> => {
    const [items, blocks] = await Promise.all([
      loadTagMembersByKind(dataset, 'item'),
      loadTagMembersByKind(dataset, 'block'),
    ]);
    const merged: Record<string, string[]> = { ...items };
    for (const [tag, ids] of Object.entries(blocks)) {
      merged[tag] = merged[tag] ? [...merged[tag], ...ids] : ids;
    }
    return merged;
  },
  (dataset) => `${dataset.id}/${dataset.version ?? ''} all`,
);

function loadTagMembersByKind(
  dataset: DatasetRef,
  kind: string,
): Promise<Record<string, string[]>> {
  return tagMembersByKindCache(dataset, kind);
}

export function loadAllTagMembers(
  dataset: DatasetRef,
): Promise<Record<string, string[]>> {
  return allTagMembersCache(dataset);
}

