import {
  asTaggedReference,
  stackIdFromRef,
  type ReferenceKind,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';

const LINK_KINDS = [
  'item',
  'block',
  'fluid',
  'entity',
  'tag',
  'texture',
  'recipe',
  'quest',
  'guide',
] as const;

export type ResourceKind = (typeof LINK_KINDS)[number];

export function asResourceKind(value: unknown): ResourceKind | undefined {
  return typeof value === 'string' &&
    (LINK_KINDS as readonly string[]).includes(value)
    ? (value as ResourceKind)
    : undefined;
}

export function referenceKindFromResource(
  kind: ResourceKind | undefined,
): ReferenceKind | undefined {
  switch (kind) {
    case 'tag':
      return 'itemTag';
    case 'item':
    case 'block':
    case 'fluid':
    case 'entity':
    case 'texture':
    case 'recipe':
    case 'quest':
    case 'guide':
      return kind;
    default:
      return undefined;
  }
}

export function referenceFrom(value: unknown): TaggedReference | undefined {
  const tagged = asTaggedReference(value);
  if (tagged) return { kind: tagged.kind, id: stackIdFromRef(tagged) };
  const row = asRecord(value);
  const tagId = asString(row?.tag);
  if (tagId && row?.id === undefined && row?.kind === undefined) {
    return { kind: 'itemTag', id: `#${tagId}` };
  }
  const kind = referenceKindFromResource(asResourceKind(row?.kind));
  const id = asString(row?.id);
  return kind && id ? { kind, id } : undefined;
}

