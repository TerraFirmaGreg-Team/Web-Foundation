import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asIdTable, EDGE_TABLE_FIELD } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asEntry, displayOf } from '@terrafirmagreg-team/dump/lib/dump/data/registry/parse';
import { parseStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpDisplay, DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type {
  DumpBlockEntry,
  DumpEntityEntry,
  DumpFluidEntry,
  DumpItemEntry,
  DumpRegistryEntry,
  DumpRegistryKind,
} from '@terrafirmagreg-team/dump/lib/dump/data/registry/dto';
import {
  clientRegistryEntries,
  clientRegistryNsEntries,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

type RegistryByKind = {
  items: DumpItemEntry;
  blocks: DumpBlockEntry;
  fluids: DumpFluidEntry;
  entities: DumpEntityEntry;
};

const KIND_FILE: Record<DumpRegistryKind, string> = {
  items: 'items',
  blocks: 'blocks',
  fluids: 'fluids',
  entities: 'entities',
};

const clientRegistry = createDatasetCache(
  async (
    dataset: DatasetRef,
    kind: DumpRegistryKind,
  ): Promise<Map<string, DumpRegistryEntry>> => {
    const out = new Map<string, DumpRegistryEntry>();
    const file = KIND_FILE[kind];
    const entries = await clientRegistryEntries(dataset, file);
    const ids = asIdTable(entries);
    for (const [id, raw] of Object.entries(entries ?? {})) {
      if (id === EDGE_TABLE_FIELD) continue;
      const entry = asEntry(raw, kind, id, ids);
      if (!entry) continue;
      if (!out.has(id)) out.set(id, entry);
      if (entry.id !== id && !out.has(entry.id)) {
        out.set(entry.id, entry);
      }
    }
    return out;
  },
);

export function loadClientRegistry<K extends DumpRegistryKind>(
  dataset: DatasetRef,
  kind: K,
): Promise<Map<string, RegistryByKind[K]>> {
  return clientRegistry(dataset, kind) as Promise<Map<string, RegistryByKind[K]>>;
}

const clientRegistryNs = createDatasetCache(
  async (
    dataset: DatasetRef,
    kind: DumpRegistryKind,
    ns: string,
  ): Promise<Map<string, DumpRegistryEntry>> => {
    const out = new Map<string, DumpRegistryEntry>();
    const entries = await clientRegistryNsEntries(dataset, KIND_FILE[kind], ns);
    const ids = asIdTable(entries);
    for (const [id, raw] of Object.entries(entries ?? {})) {
      if (id === EDGE_TABLE_FIELD) continue;
      const entry = asEntry(raw, kind, id, ids);
      if (!entry) continue;
      if (!out.has(id)) out.set(id, entry);
      if (entry.id !== id && !out.has(entry.id)) {
        out.set(entry.id, entry);
      }
    }
    return out;
  },
);

export function loadClientRegistryNs<K extends DumpRegistryKind>(
  dataset: DatasetRef,
  kind: K,
  ns: string,
): Promise<Map<string, RegistryByKind[K]>> {
  return clientRegistryNs(dataset, kind, ns) as Promise<
    Map<string, RegistryByKind[K]>
  >;
}

export async function loadClientRegistryEntry<K extends DumpRegistryKind>(
  dataset: DatasetRef,
  kind: K,
  id: string,
): Promise<RegistryByKind[K] | undefined> {
  const base = parseStackId(id).id;
  const ns = base.includes(':') ? base.split(':', 1)[0] : 'minecraft';
  if (!ns) return undefined;
  const map = await loadClientRegistryNs(dataset, kind, ns);
  return map.get(id) ?? map.get(base);
}

export function resolveClientStackDisplay(
  compactId: string,
  items: Map<string, DumpItemEntry>,
  fluids: Map<string, DumpFluidEntry>,
): DumpDisplay | undefined {
  const parsed = parseStackId(compactId);
  const item = items.get(parsed.id);
  if (item) return displayOf(item, parsed.nbt);
  const fluid = fluids.get(parsed.id);
  if (fluid) return displayOf(fluid, parsed.nbt);
  return undefined;
}

const SINGULAR_KIND: Record<string, DumpRegistryKind> = {
  item: 'items',
  block: 'blocks',
  fluid: 'fluids',
  entity: 'entities',
};

export function clientRegistryKindFor(kind: string): DumpRegistryKind {
  return SINGULAR_KIND[kind] ?? (kind as DumpRegistryKind);
}

export async function loadClientRegistryOrder(
  dataset: DatasetRef,
  kind: string,
): Promise<string[]> {
  const entries = await loadClientRegistry(dataset, clientRegistryKindFor(kind));
  return [...entries.values()]
    .flatMap((entry) => (entry.order != null ? [entry] : []))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id))
    .map((entry) => entry.id);
}

export async function loadClientRegistryTooltips(
  dataset: DatasetRef,
  kind: string,
): Promise<Record<string, DumpText[]> | undefined> {
  const entries = await loadClientRegistry(dataset, clientRegistryKindFor(kind));
  const out: Record<string, DumpText[]> = {};
  for (const entry of entries.values()) {
    const tooltip = entry.display?.tooltip;
    if (tooltip?.length) out[entry.id] = tooltip;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function loadClientRegistryTooltipsMod(
  dataset: DatasetRef,
  kind: string,
  mod: string,
): Promise<Record<string, DumpText[]> | undefined> {
  const entries = await loadClientRegistryNs(
    dataset,
    clientRegistryKindFor(kind),
    mod,
  );
  const out: Record<string, DumpText[]> = {};
  for (const entry of entries.values()) {
    const lines = entry.display?.tooltipMods?.[mod];
    if (lines?.length) out[entry.id] = lines;
  }
  return Object.keys(out).length ? out : undefined;
}

