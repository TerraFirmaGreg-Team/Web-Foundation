import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { ReactNode } from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { DumpNbt, ReferenceKind, TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export type EntrySize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type EntryHrefOpts = {
  tab?: string;
  type?: string;
  search?: string;
  rpage?: number;
  filename?: string;
  modId?: string;
  bookPath?: string;
  entry?: string;
  hash?: string;
  version?: string;
};

export type EntryProps = {

  reference?: TaggedReference;
  kind?: ReferenceKind;
  id?: string;
  dataset?: DatasetRef;

  name?: string;

  tag?: DumpNbt;

  lang?: Lang;
  langMap?: Record<string, string>;
  size?: EntrySize;

  variant?: 'plain' | 'chip';

  badge?: ReactNode;
  badgeClassName?: string;
  labeled?: boolean;
  label?: string;

  href?: string | false;

  copy?: boolean;
  tab?: string;
  className?: string;
  missing?: 'placeholder' | 'item' | 'hide';

  tooltip?: boolean | 'compact' | 'extended' | 'full' | 'adaptive';
  children?: ReactNode;

  icon?: TaggedReference;

  entityView?: 'auto' | 'texture' | 'egg';

  members?: string[];
} & Omit<EntryHrefOpts, 'tab'>;

export type KindEntryProps = Omit<EntryProps, 'kind'>;

export type EntryDirectiveProps = Pick<
  KindEntryProps,
  | 'id'
  | 'dataset'
  | 'name'
  | 'size'
  | 'variant'
  | 'labeled'
  | 'label'
  | 'copy'
  | 'className'
  | 'missing'
  | 'tooltip'
>;

export type BlockDirectiveProps = EntryDirectiveProps &
  Pick<KindEntryProps, 'href' | 'tab' | 'search'>;

export type ItemDirectiveProps = BlockDirectiveProps;
export type FluidDirectiveProps = BlockDirectiveProps;
export type TagDirectiveProps = BlockDirectiveProps;
export type RecipeDirectiveProps = BlockDirectiveProps;

export type EntityDirectiveProps = EntryDirectiveProps & {
  view?: 'auto' | 'texture' | 'egg' | 'model';
};

export type QuestDirectiveProps = EntryDirectiveProps &
  Pick<KindEntryProps, 'href' | 'filename'>;

export type GuideDirectiveProps = EntryDirectiveProps &
  Pick<KindEntryProps, 'href' | 'modId' | 'bookPath' | 'entry' | 'hash'>;

