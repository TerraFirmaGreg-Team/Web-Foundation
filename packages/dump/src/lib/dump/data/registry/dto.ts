import type { DumpNbt, TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type {
  BlockEntry,
  EntityEntry,
  FluidEntry,
  ItemEntry,
  SpriteEntry,
  VariantEntry,
} from '@terrafirmagreg-team/dump/lib/dump/gen';

export type { SpriteEntry };

export type DumpEntryVariant = Omit<VariantEntry, 'display' | 'tag'> & {
  tag: DumpNbt;
  display?: DumpDisplay;
};

export type DumpItemEntry = Omit<
  ItemEntry,
  'block' | 'display' | 'maxCount' | 'rarity' | 'variants'
> & {
  maxCount?: number;
  rarity?: string;
  block?: string;
  display?: DumpDisplay;
  variants?: DumpEntryVariant[];
};

export type DumpBlockEntry = Omit<BlockEntry, 'display' | 'item'> & {
  item?: TaggedReference;
  display?: DumpDisplay;
};

export type DumpFluidEntry = Omit<FluidEntry, 'display' | 'variants'> & {
  display?: DumpDisplay;
  variants?: DumpEntryVariant[];
};

export type DumpEntityEntry = Omit<
  EntityEntry,
  'display' | 'model' | 'texture' | 'variants'
> & {
  display?: DumpDisplay;
  texture?: string;
  model?: string;
  variants?: DumpEntryVariant[];
};

export type DumpRegistryKind = 'items' | 'blocks' | 'fluids' | 'entities';

export type DumpRegistryEntry =
  | DumpItemEntry
  | DumpBlockEntry
  | DumpFluidEntry
  | DumpEntityEntry;

