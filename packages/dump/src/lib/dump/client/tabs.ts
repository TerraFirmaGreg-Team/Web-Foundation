import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asTab, asTabItems } from '@terrafirmagreg-team/dump/lib/dump/data/tab/parse';
import type { DumpCreativeTab, DumpCreativeTabs } from '@terrafirmagreg-team/dump/lib/dump/data/tab/dto';
import { clientRegistryEntries } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

export const loadClientTabs = createDatasetCache(
  async (dataset: DatasetRef): Promise<DumpCreativeTabs> => {
    const tabs: DumpCreativeTab[] = [];
    const members: Record<string, string[]> = {};
    const entries = await clientRegistryEntries(dataset, 'tabs');
    for (const raw of Object.values(entries ?? {})) {
      const tab = asTab(raw);
      if (!tab) continue;
      tabs.push(tab);
      const items = asTabItems(raw);
      if (items.length) members[tab.id] = items;
    }
    tabs.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    return { tabs, members };
  },
);

