import { formatNbt, parseSnbt } from '@terrafirmagreg-team/dump/lib/snbt';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';

const REFERENCE_KINDS = [
  'item',
  'block',
  'fluid',
  'entity',
  'itemTag',
  'blockTag',
  'fluidTag',
  'entityTag',
  'texture',
  'model',
  'recipe',
  'guide',
  'quest',
  'chapter',
] as const;

export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

const TAG_KINDS = ['itemTag', 'blockTag', 'fluidTag', 'entityTag'] as const;

const ICON_KINDS: readonly ReferenceKind[] = [
  'item',
  'block',
  'fluid',
  'entity',
  ...TAG_KINDS,
  'texture',
];

export type DumpNbt =
  | string
  | number
  | boolean
  | null
  | DumpNbt[]
  | { [key: string]: DumpNbt };

export type TaggedReference = {
  kind: ReferenceKind;
  id: string;
  tag?: DumpNbt;
};

export type ParsedStackId = {
  id: string;
  nbt?: DumpNbt;
};

function asReferenceKind(value: unknown): ReferenceKind | undefined {
  if (typeof value !== 'string') return undefined;
  return (REFERENCE_KINDS as readonly string[]).includes(value)
    ? (value as ReferenceKind)
    : undefined;
}

export function asNbt(value: unknown): DumpNbt | undefined {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) return value as DumpNbt[];
  const row = asRecord(value);
  if (!row || Object.keys(row).length === 0) return undefined;
  return row as { [key: string]: DumpNbt };
}

export function nbtAt(
  tag: DumpNbt | undefined,
  ...path: (string | number)[]
): DumpNbt | undefined {
  let cur: DumpNbt | undefined = tag;
  for (const key of path) {
    if (cur === undefined || cur === null) return undefined;
    if (typeof key === 'number') {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[key];
      continue;
    }
    if (typeof cur !== 'object' || Array.isArray(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

export function parseStackId(compact: string): ParsedStackId {
  const brace = compact.indexOf('{');
  if (brace <= 0) return { id: compact };
  const id = compact.slice(0, brace);
  if (!id) return { id: compact };
  try {
    const nbt = asNbt(parseSnbt(compact.slice(brace)));
    return nbt !== undefined ? { id, nbt } : { id };
  } catch {
    return { id };
  }
}

export function stackIdBase(compact: string): string {
  const brace = compact.indexOf('{');
  return brace > 0 ? compact.slice(0, brace) : compact;
}

export function canonicalStackId(compact: string): string {
  const brace = compact.indexOf('{');
  if (brace <= 0) return compact;
  const parsed = parseStackId(compact);
  const nbt = formatNbt(parsed.nbt);
  return nbt !== undefined && nbt.startsWith('{')
    ? `${parsed.id}${nbt}`
    : compact;
}

export function asTaggedReference(value: unknown): TaggedReference | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const kind = asReferenceKind(row.kind);
  const id = asString(row.id);
  if (!kind || !id) return undefined;
  const tag = asNbt(row.tag);
  return { kind, id, ...(tag !== undefined ? { tag } : {}) };
}

export function isTagKind(
  kind: ReferenceKind | undefined,
): kind is (typeof TAG_KINDS)[number] {
  return kind !== undefined && (TAG_KINDS as readonly string[]).includes(kind);
}

export function tagKindOf(
  kind: ReferenceKind | undefined,
): 'item' | 'block' | 'fluid' | 'entity' | undefined {
  switch (kind) {
    case 'itemTag':
      return 'item';
    case 'blockTag':
      return 'block';
    case 'fluidTag':
      return 'fluid';
    case 'entityTag':
      return 'entity';
    default:
      return undefined;
  }
}

export function isIconKind(kind: ReferenceKind | undefined): boolean {
  return kind !== undefined && ICON_KINDS.includes(kind);
}

export function classifyRefId(
  id: string,
  kind?: ReferenceKind,
): TaggedReference | undefined {
  const trimmed = id.trim();
  if (!trimmed) return undefined;
  const parsed = parseStackId(
    trimmed.startsWith('#') ? trimmed.slice(1) : trimmed,
  );
  const resolved = trimmed.startsWith('#')
    ? (isTagKind(kind) ? kind : 'itemTag')
    : (kind ?? 'item');
  return {
    kind: resolved,
    id: parsed.id,
    ...(parsed.nbt !== undefined ? { tag: parsed.nbt } : {}),
  };
}

export function refId(ref: TaggedReference): string {
  return stackIdFromRef(ref);
}

export function compactRefId(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  const tagged = asTaggedReference(value);
  return tagged ? stackIdFromRef(tagged) : undefined;
}

function nbtEquals(left: DumpNbt | undefined, right: DumpNbt | undefined): boolean {
  if (left === right) return true;
  if (left === undefined || right === undefined) return false;
  if (left === null || right === null) return left === right;
  if (typeof left !== typeof right) return false;
  if (typeof left !== 'object') return left === right;
  if (Array.isArray(left)) {
    return (
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => nbtEquals(value, right[index]))
    );
  }
  if (Array.isArray(right)) return false;
  const leftRow = left as { [key: string]: DumpNbt };
  const rightRow = right as { [key: string]: DumpNbt };
  const leftKeys = Object.keys(leftRow).sort();
  const rightKeys = Object.keys(rightRow).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    (key, index) => key === rightKeys[index] && nbtEquals(leftRow[key], rightRow[key]),
  );
}

function nbtMatches(pattern: DumpNbt | undefined, actual: DumpNbt | undefined): boolean {
  if (pattern === undefined) return actual === undefined;
  if (actual === undefined || actual === null) return pattern === actual;
  if (pattern === null) return actual === null;
  if (typeof pattern !== 'object') return pattern === actual;
  if (Array.isArray(pattern)) {
    if (!Array.isArray(actual) || pattern.length !== actual.length) return false;
    return pattern.every((item, index) => nbtMatches(item, actual[index]));
  }
  if (typeof actual !== 'object' || Array.isArray(actual) || actual === null) return false;
  const actualRow = actual as { [key: string]: DumpNbt };
  return Object.entries(pattern).every(([key, value]) => nbtMatches(value, actualRow[key]));
}

function nbtKeyCount(tag: DumpNbt | undefined): number {
  return tag !== null && typeof tag === 'object' && !Array.isArray(tag)
    ? Object.keys(tag ?? {}).length
    : 0;
}

function nbtSharedKeys(left: DumpNbt | undefined, right: DumpNbt | undefined): number {
  if (!left || !right) return 0;
  if (typeof left !== 'object' || Array.isArray(left)) return 0;
  if (typeof right !== 'object' || Array.isArray(right)) return 0;
  const rightRow = right as { [key: string]: DumpNbt };
  let shared = 0;
  for (const [key, value] of Object.entries(left)) {
    if (key in rightRow && nbtEquals(value, rightRow[key])) shared++;
  }
  return shared;
}

export function nbtSpecificity(candidate: DumpNbt, query: DumpNbt): number {
  if (nbtEquals(candidate, query)) return 500;
  if (nbtMatches(candidate, query)) return 400 + nbtKeyCount(candidate);
  if (nbtMatches(query, candidate)) return 300 - nbtKeyCount(candidate);
  const shared = nbtSharedKeys(candidate, query);
  return shared > 0 ? 200 + shared : -1;
}

export function stackIdFromRef(ref: TaggedReference): string {
  switch (ref.kind) {
    case 'itemTag':
    case 'blockTag':
    case 'fluidTag':
    case 'entityTag':
      return `#${ref.id.replace(/^#+/, '')}`;
    default: {
      const tag = formatNbt(ref.tag);
      return tag !== undefined && tag.startsWith('{') ? `${ref.id}${tag}` : ref.id;
    }
  }
}

