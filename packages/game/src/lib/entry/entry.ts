import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { entryHref } from '@terrafirmagreg-team/game/lib/entry/href';
import { tagKindOf } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { EntryProps } from '@terrafirmagreg-team/game/types/entry';

export function usesStackTooltip(kind: ReferenceKind | undefined): boolean {
  switch (kind) {
    case 'texture':
    case 'model':
    case 'recipe':
    case 'quest':
    case 'guide':
    case 'chapter':
      return false;
    default:
      return true;
  }
}

export function tooltipLoadKind(
  kind: ReferenceKind | undefined,
): 'item' | 'fluid' | 'entity' | undefined {
  const member = tagKindOf(kind) ?? kind;
  if (member === 'fluid') return 'fluid';
  if (member === 'entity') return 'entity';
  return 'item';
}

export function resolveEntryHref(
  props: EntryProps & { dataset: DatasetRef },
): string | undefined {
  if (props.href === false) return undefined;
  if (typeof props.href === 'string') return props.href;
  if (!props.lang) return undefined;
  const kind = props.reference?.kind ?? props.kind ?? 'item';
  const id = props.reference?.id ?? props.id;
  if (!id) return undefined;
  if (kind === 'entity' || kind === 'texture' || kind === 'model') {
    return undefined;
  }
  return entryHref(
    props.dataset,
    props.lang,
    props.reference ?? { kind, id, ...(props.tag !== undefined ? { tag: props.tag } : {}) },
    {
      tab: props.tab,
      type: props.type,
      search: props.search,
      rpage: props.rpage,
      filename: props.filename,
      modId: props.modId,
      bookPath: props.bookPath,
      entry: props.entry,
      hash: props.hash,
    },
  );
}

