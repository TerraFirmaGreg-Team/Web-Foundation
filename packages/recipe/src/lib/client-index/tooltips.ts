import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { clientDumpLangNames } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadClientKeybinds } from '@terrafirmagreg-team/dump/lib/dump/client/keybinds';
import {
  loadClientRegistryTooltips,
  loadClientRegistryTooltipsMod,
} from '@terrafirmagreg-team/dump/lib/dump/client/registry';
import { dumpTextLines } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

const TOOLTIP_MODS = ['shift', 'ctrl', 'alt'] as const;

const tooltipsApiCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    lang: string,
  ): Promise<{
    lines: Record<string, string[]>;
    mods: Record<string, Record<string, string[]>>;
  }> => {
    const kinds = ['item', 'block', 'fluid', 'entity'] as const;
    const [map, keybinds, shards, modShards] = await Promise.all([
      clientDumpLangNames(dataset, lang),
      loadClientKeybinds(dataset),
      Promise.all(
        kinds.map((kind) => loadClientRegistryTooltips(dataset, kind)),
      ),
      Promise.all(
        kinds.flatMap((kind, kindIndex) =>
          TOOLTIP_MODS.map(async (mod) => ({
            kindIndex,
            mod,
            shard: await loadClientRegistryTooltipsMod(dataset, kind, mod),
          })),
        ),
      ),
    ]);
    const lines: Record<string, string[]> = {};
    const mods: Record<string, Record<string, string[]>> = {};
    for (const shard of shards) {
      for (const [id, raw] of Object.entries(shard ?? {})) {
        if (id in lines) continue;
        const resolved = dumpTextLines(map, raw, keybinds);
        if (resolved.length) lines[id] = resolved;
      }
    }
    for (const { mod, shard } of modShards) {
      const table = (mods[mod] ??= {});
      for (const [id, raw] of Object.entries(shard ?? {})) {
        if (id in table) continue;
        const resolved = dumpTextLines(map, raw, keybinds);
        if (resolved.length) table[id] = resolved;
      }
    }
    return { lines, mods };
  },
);

const tooltipsCache = createDatasetCache(
  async (
    dataset: DatasetRef,
    lang: string,
  ): Promise<Record<string, string[]>> =>
    (await tooltipsApiCache(dataset, lang)).lines,
  (dataset, lang) => `${dataset.id}/${dataset.version ?? ''} ${lang}`,
);

export async function loadItemTooltips(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string[]>> {
  return tooltipsCache(dataset, lang);
}

