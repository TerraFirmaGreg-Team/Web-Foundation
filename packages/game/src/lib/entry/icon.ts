import { tagKindOf } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export function stackKindOf(
  kind: ReferenceKind | undefined,
): 'item' | 'block' | 'fluid' | undefined {
  if (kind === 'item' || kind === 'block' || kind === 'fluid') return kind;
  const member = tagKindOf(kind);
  return member === 'entity' ? undefined : member;
}

