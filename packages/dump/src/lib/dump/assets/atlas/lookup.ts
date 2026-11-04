import type {
  AtlasLookup,
  AtlasSprite,
  IconAtlas,
  SpriteQuery,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import {
  asTaggedReference,
  nbtSpecificity,
  parseStackId,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpNbt, TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { formatNbt } from '@terrafirmagreg-team/dump/lib/snbt';

export { atlasPagePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';

function asStackKind(
  kind: string | undefined,
): SpriteQuery['kind'] | undefined {
  return kind === 'item' || kind === 'block' || kind === 'fluid' ? kind : undefined;
}

function asSpriteQuery(
  value: string | TaggedReference | SpriteQuery | null | undefined,
  kind?: SpriteQuery['kind'],
): SpriteQuery | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = parseStackId(trimmed);
    if (!parsed.id) return null;
    return {
      id: parsed.id,
      ...(kind ? { kind } : {}),
      ...(parsed.nbt !== undefined ? { tag: parsed.nbt } : {}),
    };
  }
  const tagged = asTaggedReference(value);
  if (tagged) {
    const stackKind = asStackKind(tagged.kind);
    if (!stackKind) return null;
    return {
      kind: kind ?? stackKind,
      id: tagged.id,
      ...(tagged.tag !== undefined ? { tag: tagged.tag } : {}),
    };
  }
  if (typeof value === 'object' && typeof value.id === 'string' && value.id) {
    const resolvedKind = kind ?? asStackKind(value.kind);
    return {
      id: value.id,
      ...(resolvedKind ? { kind: resolvedKind } : {}),
      ...(value.tag !== undefined ? { tag: value.tag } : {}),
    };
  }
  return null;
}

function spriteScore(
  ref: TaggedReference,
  query: SpriteQuery,
  preferVariant: boolean,
): number {
  if (ref.id !== query.id) return -1;
  if (query.kind && ref.kind !== query.kind) return -1;
  if (query.tag === undefined) {
    if (ref.tag === undefined) return 500;
    return preferVariant ? 600 : -1;
  }
  if (ref.tag === undefined) return 100;
  return nbtSpecificity(ref.tag, query.tag);
}

type SpriteBucket = {
  all: AtlasSprite[];
  untagged: AtlasSprite[];
  tagged: AtlasSprite[];
  byTag: Map<string, AtlasSprite[]>;
  maxTagKeys: number;
};

const atlasIndex = new WeakMap<IconAtlas, Map<string, SpriteBucket>>();

const EXACT_SAFE_MAX_KEYS = 99;

function nbtTopKeys(tag: DumpNbt | undefined): number {
  return tag !== null && typeof tag === 'object' && !Array.isArray(tag)
    ? Object.keys(tag ?? {}).length
    : 0;
}

function spriteBuckets(atlas: IconAtlas): Map<string, SpriteBucket> {
  let byId = atlasIndex.get(atlas);
  if (byId) return byId;
  byId = new Map();
  for (const sprite of atlas.sprites) {
    const bucket =
      byId.get(sprite.ref.id) ??
      (() => {
        const created: SpriteBucket = {
          all: [],
          untagged: [],
          tagged: [],
          byTag: new Map(),
          maxTagKeys: 0,
        };
        byId.set(sprite.ref.id, created);
        return created;
      })();
    bucket.all.push(sprite);
    if (sprite.ref.tag === undefined) {
      bucket.untagged.push(sprite);
      continue;
    }
    bucket.tagged.push(sprite);
    const keyCount = nbtTopKeys(sprite.ref.tag);
    if (keyCount > bucket.maxTagKeys) bucket.maxTagKeys = keyCount;
    const key = formatNbt(sprite.ref.tag);
    if (key !== undefined) {
      const list = bucket.byTag.get(key);
      if (list) list.push(sprite);
      else bucket.byTag.set(key, [sprite]);
    }
  }
  atlasIndex.set(atlas, byId);
  return byId;
}

function spriteHit(
  atlas: IconAtlas,
  sprite: AtlasSprite,
): AtlasLookup | null {
  const page = atlas.pages[sprite.page];
  return page ? { atlas, sprite, page, spriteId: sprite.ref.id } : null;
}

function lookupSprite(
  atlas: IconAtlas | null | undefined,
  query?: string | TaggedReference | SpriteQuery | null,
  kind?: SpriteQuery['kind'],
  preferVariant = false,
): AtlasLookup | null {
  if (!atlas || query == null) return null;
  const resolved = asSpriteQuery(query, kind);
  if (!resolved) return null;
  const bucket = spriteBuckets(atlas).get(resolved.id);
  if (!bucket) return null;
  if (resolved.tag === undefined) {
    const first = preferVariant ? bucket.tagged : bucket.untagged;
    const second = preferVariant ? bucket.untagged : bucket.tagged;
    for (const list of [first, second]) {
      for (const sprite of list) {
        if (resolved.kind && sprite.ref.kind !== resolved.kind) continue;
        const hit = spriteHit(atlas, sprite);
        if (hit) return hit;
      }
    }
    return null;
  }
  if (bucket.maxTagKeys <= EXACT_SAFE_MAX_KEYS) {
    const exacts = bucket.byTag.get(formatNbt(resolved.tag) ?? '');
    if (exacts) {
      for (const sprite of exacts) {
        if (resolved.kind && sprite.ref.kind !== resolved.kind) continue;
        const hit = spriteHit(atlas, sprite);
        if (hit) return hit;
      }
    }
  }
  let best: AtlasLookup | null = null;
  let bestScore = -1;
  for (const sprite of bucket.all) {
    const score = spriteScore(sprite.ref, resolved, preferVariant);
    if (score <= bestScore) continue;
    const hit = spriteHit(atlas, sprite);
    if (!hit) continue;
    best = hit;
    bestScore = score;
  }
  return best;
}

export function lookupSpriteInBundle(
  bundle: { items: IconAtlas | null; blocks: IconAtlas | null } | null | undefined,
  query?: string | TaggedReference | SpriteQuery | null,
  kind?: SpriteQuery['kind'],
  preferVariant = false,
): AtlasLookup | null {
  if (!bundle) return null;
  const resolved = asSpriteQuery(query, kind);
  if (!resolved) return null;
  if (resolved.kind === 'block') {
    return (
      lookupSprite(bundle.blocks, resolved, undefined, preferVariant) ??
      lookupSprite(bundle.items, resolved, undefined, preferVariant)
    );
  }
  if (resolved.kind === 'item' || resolved.kind === 'fluid') {
    return lookupSprite(bundle.items, resolved, undefined, preferVariant);
  }
  return (
    lookupSprite(bundle.items, resolved, undefined, preferVariant) ??
    lookupSprite(bundle.blocks, resolved, undefined, preferVariant)
  );
}

