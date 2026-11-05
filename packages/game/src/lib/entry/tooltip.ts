import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { displayOf } from '@terrafirmagreg-team/dump/lib/dump/data/registry/parse';
import {
  parseStackId,
  tagKindOf,
  type ReferenceKind,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import {
  clientRegistryKindFor,
  loadClientRegistry,
} from '@terrafirmagreg-team/dump/lib/dump/client/registry';
import type { DumpDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import {
  dumpTextLines,
  stackDisplayName,
} from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { fetchTagMembers } from '@terrafirmagreg-team/game/lib/entry/icon-load';

export const loadStackDisplay = createDatasetCache(
  async (
    dataset: DatasetRef,
    compactId: string,
    kind?: 'item' | 'fluid' | 'entity',
  ): Promise<DumpDisplay | undefined> => {
    const parsed = parseStackId(compactId);
    const ofKind = async (registry: 'items' | 'fluids') => {
      const entry = (await loadClientRegistry(dataset, registry)).get(
        parsed.id,
      );
      return entry ? displayOf(entry, parsed.nbt) : undefined;
    };
    if (kind) {
      const entry = (
        await loadClientRegistry(dataset, clientRegistryKindFor(kind))
      ).get(parsed.id);
      return entry ? displayOf(entry, parsed.nbt) : undefined;
    }
    return (await ofKind('items')) ?? (await ofKind('fluids'));
  },
);

type StackTooltip = {
  lines: string[];
  mods: Record<string, string[]>;
};

export async function stackTooltip(
  dataset: DatasetRef,
  id: string,
  lang: string | undefined,
  langMap: Record<string, string> | undefined,
  kind: ReferenceKind | undefined,
): Promise<StackTooltip> {
  const map =
    langMap ?? (lang ? await clientDumpLang(dataset, lang) : undefined);
  if (id.startsWith('#')) {
    if (!map) return { lines: [], mods: {} };
    const members = await fetchTagMembers(
      dataset,
      id.slice(1),
      tagKindOf(kind) ?? 'item',
    );
    return {
      lines: members.map((member) => stackDisplayName(map, member)),
      mods: {},
    };
  }
  const memberKind = tagKindOf(kind) ?? kind;
  const loadKind =
    memberKind === 'fluid' || memberKind === 'entity'
      ? memberKind
      : 'item';
  const display = await loadStackDisplay(dataset, id, loadKind);
  if (!display || !map) return { lines: [], mods: {} };
  const mods: Record<string, string[]> = {};
  for (const [mod, raw] of Object.entries(display.tooltipMods ?? {})) {
    const resolved = dumpTextLines(map, raw);
    if (resolved.length) mods[mod] = resolved;
  }
  return {
    lines: display.tooltip?.length ? dumpTextLines(map, display.tooltip) : [],
    mods,
  };
}

