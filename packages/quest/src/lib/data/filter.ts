import {
  isTagKind,
  parseStackId,
  stackIdFromRef,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { ReferenceKind, TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

const RESOURCE_ID = /^[a-z0-9_.-]+:[a-z0-9_/.-]+$/;

const FILTER_TAGS: Record<string, ReferenceKind> = {
  tag: 'itemTag',
  item_tag: 'itemTag',
  block_tag: 'blockTag',
  fluid_tag: 'fluidTag',
  entity_tag: 'entityTag',
};

const FILTER_STACKS: Record<string, ReferenceKind> = {
  item: 'item',
  block: 'block',
  fluid: 'fluid',
  entity: 'entity',
};

const GROUPS = new Set(['or', 'and', 'xor', 'any', 'all']);

const NEGATED = /(?:[a-z0-9_]+:)?(?:not|none)\(/i;

function callEnd(text: string, openAt: number): number {
  let depth = 0;
  let brace = 0;
  let quote = false;
  for (let i = openAt; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '"') quote = false;
      continue;
    }
    if (ch === '"') {
      quote = true;
      continue;
    }
    if (ch === '{') brace++;
    else if (ch === '}') brace--;
    else if (brace === 0 && ch === '(') depth++;
    else if (brace === 0 && ch === ')') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return text.length;
}

function stripNegated(expr: string): string {
  let out = expr;
  for (;;) {
    const match = NEGATED.exec(out);
    if (!match) return out;
    const openAt = match.index + match[0].length - 1;
    out = out.slice(0, match.index) + out.slice(callEnd(out, openAt));
  }
}

function bareRef(trimmed: string): TaggedReference | undefined {
  if (trimmed.startsWith('#')) {
    const id = trimmed.slice(1);
    return RESOURCE_ID.test(id) ? { kind: 'itemTag', id } : undefined;
  }
  const parsed = parseStackId(trimmed);
  if (!RESOURCE_ID.test(parsed.id)) return undefined;
  return {
    kind: 'item',
    id: parsed.id,
    ...(parsed.nbt !== undefined ? { tag: parsed.nbt } : {}),
  };
}

export function parseFilterRefs(filter: string): TaggedReference[] {
  const trimmed = filter.trim();
  if (!trimmed) return [];
  if (!trimmed.includes('(')) {
    const ref = bareRef(trimmed);
    return ref ? [ref] : [];
  }
  const expr = stripNegated(trimmed);
  const refs: TaggedReference[] = [];
  const seen = new Set<string>();
  const leaf = /(?:[a-zA-Z0-9_]+:)?([a-zA-Z0-9_]+)\(([^()]+)\)/g;
  for (const match of expr.matchAll(leaf)) {
    const fn = match[1].toLowerCase();
    const arg = match[2].trim();
    const tagKind = FILTER_TAGS[fn];
    const stackKind = FILTER_STACKS[fn];
    const found: TaggedReference[] = [];
    if (GROUPS.has(fn) && arg) {
      for (const part of arg.split(/\s+/)) {
        const ref = bareRef(part);
        if (ref) found.push(ref);
      }
    } else if (tagKind) {
      const id = arg.startsWith('#') ? arg.slice(1) : arg;
      if (RESOURCE_ID.test(id)) found.push({ kind: tagKind, id });
    } else if (stackKind) {
      const parsed = parseStackId(arg);
      if (RESOURCE_ID.test(parsed.id)) {
        found.push({
          kind: stackKind,
          id: parsed.id,
          ...(parsed.nbt !== undefined ? { tag: parsed.nbt } : {}),
        });
      }
    }
    for (const ref of found) {
      const key = `${ref.kind}:${ref.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      refs.push(ref);
    }
  }
  return refs;
}

export function parseFilterIds(filter: string): string[] {
  return parseFilterRefs(filter).map((ref) =>
    isTagKind(ref.kind) ? `#${ref.id}` : stackIdFromRef(ref),
  );
}

