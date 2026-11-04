import {
  asTaggedReference,
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { referenceFrom, type ResourceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/kind';

function itemstackIds(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .map((part) => (part.startsWith('tag:') ? `#${part.slice(4)}` : part))
    .filter(
      (part) =>
        part && (part.startsWith('#') || part.includes(':')) && !part.endsWith('.png'),
    );
}

export function collectItemIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(collectItemIds);
  if (typeof value === 'string') return itemstackIds(value);
  const tagged = asTaggedReference(value);
  if (tagged) {
    if (
      tagged.kind === 'item' ||
      tagged.kind === 'itemTag' ||
      tagged.kind === 'block' ||
      tagged.kind === 'blockTag'
    ) {
      return [stackIdFromRef(tagged)];
    }
    return [];
  }
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if ('item' in row) return collectItemIds(row.item);
    const tag = asString(row.tag);
    if (tag) return collectItemIds(`#${tag}`);
    const id = asString(row.id);
    if (id) return collectItemIds(id);
  }
  return [];
}

export function parseGuideIcon(value: unknown): TaggedReference | undefined {
  if (!value) return undefined;
  const ref = referenceFrom(value);
  if (ref) return ref;
  if (typeof value !== 'string') return undefined;
  const id = value.trim();
  if (!id) return undefined;
  return { kind: id.endsWith('.png') ? 'texture' : 'item', id };
}

const GUIDE_ITEM_KINDS: readonly TaggedReference['kind'][] = [
  'item',
  'block',
  'itemTag',
  'blockTag',
  'fluidTag',
  'entityTag',
];

export function parseGuideItems(value: unknown): TaggedReference[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(parseGuideItems);
  if (typeof value === 'string') {
    return itemstackIds(value).map((id) =>
      id.startsWith('#')
        ? { kind: 'itemTag' as const, id }
        : { kind: 'item' as const, id },
    );
  }
  const ref = parseGuideIcon(value);
  return ref && GUIDE_ITEM_KINDS.includes(ref.kind) ? [ref] : [];
}

export function classifyGuidePageType(type: string | undefined): ResourceKind | undefined {
  switch ((type ?? '').toLowerCase().trim()) {
    case 'entity':
      return 'entity';
    case 'item':
      return 'item';
    case 'block':
      return 'block';
    case 'fluid':
      return 'fluid';
    default:
      return undefined;
  }
}

