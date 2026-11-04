import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asStringMap } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { clientDumpJson } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

export const loadClientKeybinds = createDatasetCache(
  async (dataset: DatasetRef): Promise<Record<string, string>> => {
    const dump = await loadDatasetDump(dataset);
    const file = dump?.mods.find((mod) => mod.keybindsFile)?.keybindsFile;
    return file
      ? (asStringMap(await clientDumpJson(dataset, file, 'high')) ?? {})
      : {};
  },
);

