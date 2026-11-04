import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { CalcKind } from '@terrafirmagreg-team/recipe/types/calc';

export type IconItem = { id: string; kind: CalcKind };

export type EntryMeta = {
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  iconItems?: IconItem[];
};

export const rowClass =
  'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors';
export const rowIdle =
  'text-muted-foreground hover:bg-accent hover:text-accent-foreground';

