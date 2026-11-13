import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { clientDumpLangNames, loadClientManifest } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

export const loadClientModNames = createDatasetCache(
  async (dataset: DatasetRef, lang: string): Promise<Record<string, string>> => {
    const manifest = await loadClientManifest(dataset);
    const map = await clientDumpLangNames(dataset, lang);
    const out: Record<string, string> = {};
    for (const [ns, entry] of Object.entries(manifest?.namespaces ?? {})) {
      const key = entry?.display?.name;
      out[ns] = langString(map, key) ?? key ?? ns;
    }
    return out;
  },
);

