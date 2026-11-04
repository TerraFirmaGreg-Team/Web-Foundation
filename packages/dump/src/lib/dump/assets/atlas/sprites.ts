import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asSpriteEntry } from '@terrafirmagreg-team/dump/lib/dump/data/registry/parse';
import { asDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import { asNbt } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type {
  AtlasKind,
  AtlasTint,
  IconAtlas,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import type { DumpRegistryKind } from '@terrafirmagreg-team/dump/lib/dump/data/registry/dto';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { SpriteEntry } from '@terrafirmagreg-team/dump/lib/dump/gen';

const TINTS = new Set(['none', 'grass', 'foliage', 'water', 'custom']);

function asTint(raw: unknown): AtlasTint | undefined {
  return typeof raw === 'string' && TINTS.has(raw) ? (raw as AtlasTint) : undefined;
}

function asTintColor(raw: unknown): string | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return `#${(raw & 0xffffff).toString(16).padStart(6, '0')}`;
  }
  if (typeof raw !== 'string' || !raw) return undefined;
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  if (/^#[0-9a-f]{8}$/i.test(raw)) return `#${raw.slice(-6)}`;
  if (/^0x[0-9a-f]{6,8}$/i.test(raw)) return `#${raw.slice(-6)}`;
  return undefined;
}

const STACK_KIND: Record<DumpRegistryKind, TaggedReference['kind']> = {
  items: 'item',
  blocks: 'block',
  fluids: 'fluid',
  entities: 'entity',
};

function pushSprite(
  atlas: IconAtlas,
  bySrc: Map<string, number>,
  ref: TaggedReference,
  sprite: SpriteEntry,
  langKey?: string,
): void {
  let page = bySrc.get(sprite.image);
  if (page === undefined) {
    atlas.pages.push({ image: sprite.image, w: sprite.pw, h: sprite.ph });
    page = atlas.pages.length - 1;
    bySrc.set(sprite.image, page);
  }
  const tint = asTint(sprite.tint);
  const tintColor = asTintColor(sprite.tintColor);
  atlas.sprites.push({
    ref,
    page,
    x: sprite.x,
    y: sprite.y,
    w: sprite.w,
    h: sprite.h,
    ...(tint ? { tint } : {}),
    ...(tintColor ? { tintColor } : {}),
    ...(langKey ? { langKey } : {}),
  });
}

export function iconAtlasFromEntries(
  value: unknown,
  dataset: DatasetRef,
  modId: string,
  kind: DumpRegistryKind,
  atlasKind: AtlasKind,
): IconAtlas | null {
  const entries = asRecord(value);
  if (!entries) return null;
  const stackKind = STACK_KIND[kind];
  const atlas: IconAtlas = { sprites: [], pages: [], modId, dataset, kind: atlasKind };
  const bySrc = new Map<string, number>();
  for (const [key, raw] of Object.entries(entries)) {
    const row = asRecord(raw);
    if (!row) continue;
    const id = asString(row.id) ?? key;
    const langKey = asDisplay(row.display)?.name;
    const sprite = asSpriteEntry(row.sprite);
    if (sprite) pushSprite(atlas, bySrc, { id, kind: stackKind }, sprite, langKey);
    const variants = row.variants;
    if (!Array.isArray(variants)) continue;
    for (const raw2 of variants) {
      const variant = asRecord(raw2);
      const variantSprite = asSpriteEntry(variant?.sprite);
      if (!variantSprite) continue;
      const tag = asNbt(variant?.tag);
      pushSprite(
        atlas,
        bySrc,
        { id, kind: stackKind, ...(tag !== undefined ? { tag } : {}) },
        variantSprite,
        asDisplay(variant?.display)?.name ?? langKey,
      );
    }
  }
  return atlas.sprites.length || atlas.pages.length ? atlas : null;
}

export function mergeAtlases(
  parts: Array<IconAtlas | null>,
  dataset: DatasetRef,
  modId: string,
  kind: AtlasKind,
): IconAtlas | null {
  const sources = parts.flatMap((part) => (part ? [part] : []));
  if (!sources.length) return null;
  const atlas: IconAtlas = { sprites: [], pages: [], modId, dataset, kind };
  const bySrc = new Map<string, number>();
  for (const source of sources) {
    const pageMap = new Map<number, number>();
    for (const [index, page] of source.pages.entries()) {
      let mapped = bySrc.get(page.image);
      if (mapped === undefined) {
        atlas.pages.push({ image: page.image, w: page.w, h: page.h });
        mapped = atlas.pages.length - 1;
        bySrc.set(page.image, mapped);
      }
      pageMap.set(index, mapped);
    }
    for (const sprite of source.sprites) {
      atlas.sprites.push({ ...sprite, page: pageMap.get(sprite.page) ?? 0 });
    }
  }
  return atlas.sprites.length || atlas.pages.length ? atlas : null;
}

