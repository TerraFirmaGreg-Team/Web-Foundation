import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { displayOf } from '@terrafirmagreg-team/dump/lib/dump/data/registry/parse';
import {
  parseStackId,
  tagKindOf,
  type ReferenceKind,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import {
  clientDumpLang,
  loadClientManifest,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import {
  clientRegistryKindFor,
  loadClientRegistryEntry,
  loadClientRegistryIconsRow,
  loadClientRegistryTooltipRow,
} from '@terrafirmagreg-team/dump/lib/dump/client/registry';
import type { DumpDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import {
  dumpTextLines,
  stackDisplayName,
  stripMcFormat,
} from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { fetchTagMembers } from '@terrafirmagreg-team/game/lib/entry/icon-load';

export const loadStackDisplay = createDatasetCache(
  async (
    dataset: DatasetRef,
    compactId: string,
    kind?: 'item' | 'fluid' | 'entity' | 'block',
  ): Promise<DumpDisplay | undefined> => {
    const parsed = parseStackId(compactId);
    const ns = parsed.id.includes(':')
      ? parsed.id.split(':', 1)[0]
      : 'minecraft';
    const ofKind = async (
      registry: 'items' | 'fluids' | 'blocks' | 'entities',
    ) => {
      const [base, tooltips] = await Promise.all([
        registry === 'entities'
          ? loadClientRegistryEntry(dataset, registry, parsed.id)
          : loadClientRegistryIconsRow(dataset, registry, ns).then((rows) =>
              rows.get(parsed.id),
            ),
        loadClientRegistryTooltipRow(dataset, registry, ns).then((rows) =>
          rows.get(parsed.id),
        ),
      ]);
      const display = base ? displayOf(base, parsed.nbt) : undefined;
      const tooltipDisplay = tooltips
        ? displayOf(tooltips, parsed.nbt)
        : undefined;
      if (!display && !tooltipDisplay) return undefined;
      return {
        ...(display?.name ? { name: display.name } : {}),
        ...(tooltipDisplay?.tooltip
          ? { tooltip: tooltipDisplay.tooltip }
          : {}),
        ...(tooltipDisplay?.tooltipMods
          ? { tooltipMods: tooltipDisplay.tooltipMods }
          : {}),
      };
    };
    if (kind) {
      return ofKind(clientRegistryKindFor(kind));
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
    memberKind === 'fluid' || memberKind === 'entity' || memberKind === 'block'
      ? memberKind
      : 'item';
  const display = await loadStackDisplay(dataset, id, loadKind);
  if (!display || !map) return { lines: [], mods: {} };
  const mods: Record<string, string[]> = {};
  for (const [mod, raw] of Object.entries(display.tooltipMods ?? {})) {
    const resolved = dumpTextLines(map, raw);
    if (resolved.length) mods[mod] = resolved;
  }
  const lines = display.tooltip?.length
    ? dumpTextLines(map, display.tooltip)
    : [];
  if (!lines.length || !lines[lines.length - 1].includes('§')) {
    const manifest = await loadClientManifest(dataset);
    const ns = parseStackId(id).id.split(':', 1)[0];
    const key = ns ? manifest?.namespaces?.[ns]?.display?.name : undefined;
    const mod = key ? map[key] : undefined;
    if (
      mod &&
      !lines.some((line) => stripMcFormat(line).trim() === mod)
    ) {
      lines.push(mod);
    }
  }
  return { lines, mods };
}

