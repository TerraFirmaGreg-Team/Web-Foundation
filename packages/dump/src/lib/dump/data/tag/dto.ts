import type { TagEntry } from '@terrafirmagreg-team/dump/lib/dump/gen';

export type DumpTag = Omit<TagEntry, 'members' | 'usedBy' | 'producedBy'> & {
  members: string[];
  usedBy: string[];
  producedBy: string[];
};

