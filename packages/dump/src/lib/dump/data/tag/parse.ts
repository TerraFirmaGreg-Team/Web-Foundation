import {
  asEdgeList,
  asRecord,
  asString,
  asStringList,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type { DumpTag } from '@terrafirmagreg-team/dump/lib/dump/data/tag/dto';

const TAG_REGISTRIES = new Set(['items', 'blocks', 'fluids', 'entities']);

function registryFromCatalogKey(manifestKey: string): {
  registry?: string;
  path: string;
  ns: string;
} {
  const colon = manifestKey.indexOf(':');
  const ns = colon > 0 ? manifestKey.slice(0, colon) : '';
  const rest = colon > 0 ? manifestKey.slice(colon + 1) : manifestKey;
  const slash = rest.indexOf('/');
  if (slash <= 0) return { ns, path: rest };
  const registry = rest.slice(0, slash);
  return {
    ns,
    path: rest.slice(slash + 1),
    ...(TAG_REGISTRIES.has(registry) ? { registry } : {}),
  };
}

export function asTag(
  raw: unknown,
  manifestKey: string,
  ids?: string[],
): DumpTag | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  const members = asStringList(row.members);
  const usedBy = asEdgeList(row.usedBy, ids);
  const producedBy = asEdgeList(row.producedBy, ids);
  const parsed = registryFromCatalogKey(manifestKey);
  const registry = asString(row.registry) ?? parsed.registry;
  if (!registry) return undefined;
  const id =
    asString(row.id) ?? (parsed.ns && parsed.path ? `${parsed.ns}:${parsed.path}` : '');
  if (!id) return undefined;
  return {
    id,
    registry,
    replace: row.replace === true,
    members,
    usedBy,
    producedBy,
  };
}

export function firstTagItem(tag: DumpTag | undefined): string | undefined {
  return tag?.members.find((value) => value && !value.startsWith('#'));
}

