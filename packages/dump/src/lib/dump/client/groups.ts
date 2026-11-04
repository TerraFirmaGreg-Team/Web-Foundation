import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asRecord, asStringList } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asDumpText, type DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import { clientRegistryEntries } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

type RegistryGroupRow = {
  id: string;
  name?: DumpText;
  members: string[];
};

export const loadClientRegistryGroups = createDatasetCache(
  async (dataset: DatasetRef): Promise<RegistryGroupRow[]> => {
    const out: RegistryGroupRow[] = [];
    const entries = await clientRegistryEntries(dataset, 'groups');
    for (const [id, raw] of Object.entries(entries ?? {})) {
      const row = asRecord(raw);
      const members = asStringList(row?.members);
      if (!id || members.length <= 1) continue;
      const name = asDumpText(row?.name);
      out.push({ id, ...(name ? { name } : {}), members });
    }
    return out;
  },
);

