import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asIdTable, EDGE_TABLE_FIELD } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTag } from '@terrafirmagreg-team/dump/lib/dump/data/tag/parse';
import type { DumpTag } from '@terrafirmagreg-team/dump/lib/dump/data/tag/dto';
import { clientRegistryEntries } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { tagHashId, tagIdForms } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

function indexKeys(tag: DumpTag, manifestKey: string): string[] {
  return [...new Set([manifestKey, ...tagIdForms(tag.id)])];
}

const loadClientTags = createDatasetCache(async (dataset: DatasetRef) => {
  const map = new Map<string, DumpTag>();
  const entries = await clientRegistryEntries(dataset, 'tags');
  const ids = asIdTable(entries);
  for (const [manifestKey, raw] of Object.entries(entries ?? {})) {
    if (manifestKey === EDGE_TABLE_FIELD) continue;
    const tag = asTag(raw, manifestKey, ids);
    if (!tag) continue;
    for (const alias of indexKeys(tag, manifestKey)) {
      if (!map.has(alias)) map.set(alias, tag);
    }
  }
  return map;
});

export async function resolveClientTag(
  dataset: DatasetRef,
  id: string,
): Promise<DumpTag | undefined> {
  const tags = await loadClientTags(dataset);
  for (const form of tagIdForms(id)) {
    const hit = tags.get(form);
    if (hit) return hit;
  }
  return undefined;
}

const MEMBER_REGISTRY: Record<string, string> = {
  item: 'items',
  block: 'blocks',
  fluid: 'fluids',
  entity: 'entities',
};

export async function loadClientTagMembers(
  dataset: DatasetRef,
  kind: string,
): Promise<Record<string, string[]> | undefined> {
  const registry = MEMBER_REGISTRY[kind] ?? kind;
  const out: Record<string, string[]> = {};
  for (const tag of (await loadClientTags(dataset)).values()) {
    if (tag.registry !== registry || !tag.members.length) continue;
    out[tagHashId(tag.id)] ??= tag.members;
  }
  return Object.keys(out).length ? out : undefined;
}

