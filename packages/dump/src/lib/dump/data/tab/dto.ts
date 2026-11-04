import type { DumpDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { TabEntry } from '@terrafirmagreg-team/dump/lib/dump/gen';

export type DumpCreativeTab = Omit<TabEntry, 'display' | 'icon' | 'items'> & {
  display: DumpDisplay;
  icon?: TaggedReference;
};

export type DumpCreativeTabs = {
  tabs: DumpCreativeTab[];
  members: Record<string, string[]>;
};

