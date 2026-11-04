import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { GuideBookRef } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';
import type { DataGuidesBook } from '@terrafirmagreg-team/dump/lib/dump/gen';

export type { GuideBookRef };

export type GuideBookJson = Omit<
  DataGuidesBook,
  'categories' | 'cover' | 'display' | 'entries' | 'macros' | 'order'
> & {
  display?: {
    name?: string;
    landing?: DumpText[];
  };
  cover?: TaggedReference | null;
  order?: number;
  macros?: Record<string, unknown>;
  categories?: Record<string, unknown>;
  entries?: Record<string, unknown>;
  [key: string]: unknown;
};

export type GuideMultiblock = {
  pattern?: string[][];
  mapping?: Record<string, unknown>;
};

export type GuideTableLegend = {
  color?: string;
  texts?: string[];
  text?: string;
};

export type GuideTableCell = {
  fill?: string;
  bold?: boolean;
  texts?: string[];
  text?: string;
  item?: unknown;
};

export type GuidePage = {
  type?: string;
  text?: string;
  texts?: string[];
  title?: string;
  name?: string;
  images?: string[];
  image?: string;
  recipes?: string[];
  item?: unknown;
  icon?: unknown;
  entity?: string;
  url?: string;
  link?: string;
  link_text?: string;
  entry?: string;
  entries?: string[];
  trigger?: string;
  quest?: string;
  multiblock?: GuideMultiblock;
  model?: string;
  multiblocks?: Array<string | GuideMultiblock>;
  columns?: string[] | number;
  rows?: string[][];
  strings?: Array<string | GuideTableCell | Array<string | GuideTableCell>>;
  legend?: GuideTableLegend[];
  fill?: boolean;
  enable_visualize?: boolean;
  border?: boolean;
  anchor?: string;
  scale?: number;
  offset?: number;
  rotate?: boolean;
  [key: string]: unknown;
};

