import {
  asEdgeList,
  asNumber,
  asRecord,
  asString,
  asStringList,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import {
  asNbt,
  asTaggedReference,
  nbtSpecificity,
  type DumpNbt,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { formatNbt } from '@terrafirmagreg-team/dump/lib/snbt';
import { asDisplay, type DumpDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type {
  DumpBlockEntry,
  DumpEntityEntry,
  DumpEntryVariant,
  DumpFluidEntry,
  DumpItemEntry,
  DumpRegistryEntry,
  DumpRegistryKind,
  SpriteEntry,
} from '@terrafirmagreg-team/dump/lib/dump/data/registry/dto';

export function asSpriteEntry(value: unknown): SpriteEntry | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const image = asString(row.image);
  const x = asNumber(row.x);
  const y = asNumber(row.y);
  const w = asNumber(row.w);
  const h = asNumber(row.h);
  const pw = asNumber(row.pw);
  const ph = asNumber(row.ph);
  if (
    !image ||
    x === undefined ||
    y === undefined ||
    w === undefined ||
    h === undefined ||
    pw === undefined ||
    ph === undefined
  ) {
    return undefined;
  }
  const tint = asString(row.tint);
  const tintColor = asString(row.tintColor);
  return {
    image,
    x,
    y,
    w,
    h,
    pw,
    ph,
    ...(tint ? { tint } : {}),
    ...(tintColor ? { tintColor } : {}),
  };
}

function asVariant(value: unknown): DumpEntryVariant | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const tag = asNbt(row.tag);
  if (tag === undefined) return undefined;
  const display = asDisplay(row.display);
  const sprite = asSpriteEntry(row.sprite);
  const texture = asString(row.texture);
  const model = asString(row.model);
  return {
    tag,
    ...(display ? { display } : {}),
    ...(sprite ? { sprite } : {}),
    ...(texture ? { texture } : {}),
    ...(model ? { model } : {}),
  };
}

function asVariants(value: unknown): DumpEntryVariant[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.flatMap((item) => {
    const variant = asVariant(item);
    return variant ? [variant] : [];
  });
  return out.length ? out : undefined;
}

const EXACT_SAFE_MAX_KEYS = 99;

const variantExactIndex = new WeakMap<
  DumpEntryVariant[],
  { byTag: Map<string, DumpEntryVariant>; maxTagKeys: number }
>();

function exactVariantIndex(variants: DumpEntryVariant[]) {
  let index = variantExactIndex.get(variants);
  if (!index) {
    const byTag = new Map<string, DumpEntryVariant>();
    let maxTagKeys = 0;
    for (const variant of variants) {
      if (variant.tag === undefined) continue;
      const keyCount =
        variant.tag !== null &&
        typeof variant.tag === 'object' &&
        !Array.isArray(variant.tag)
          ? Object.keys(variant.tag).length
          : 0;
      if (keyCount > maxTagKeys) maxTagKeys = keyCount;
      const key = formatNbt(variant.tag);
      if (key !== undefined && !byTag.has(key)) byTag.set(key, variant);
    }
    index = { byTag, maxTagKeys };
    variantExactIndex.set(variants, index);
  }
  return index;
}

export function matchVariant(
  variants: DumpEntryVariant[] | undefined,
  nbt: DumpNbt | undefined,
): DumpEntryVariant | undefined {
  if (!variants?.length) return undefined;
  if (nbt === undefined) {
    return variants.find((variant) => variant.tag === undefined);
  }
  const key = formatNbt(nbt);
  const index =
    variants.length > 16 && key !== undefined
      ? exactVariantIndex(variants)
      : undefined;
  if (index && index.maxTagKeys <= EXACT_SAFE_MAX_KEYS && key !== undefined) {
    const exact = index.byTag.get(key);
    if (exact) return exact;
  }
  let best: DumpEntryVariant | undefined;
  let bestScore = -1;
  for (const variant of variants) {
    if (variant.tag === undefined) continue;
    const score = nbtSpecificity(variant.tag, nbt);
    if (score > bestScore) {
      best = variant;
      bestScore = score;
    }
  }
  return best;
}

export function displayOf(
  entry: { display?: DumpDisplay; variants?: DumpEntryVariant[] },
  nbt?: DumpNbt,
): DumpDisplay | undefined {
  return matchVariant(entry.variants, nbt)?.display ?? entry.display;
}

function asId(value: unknown, fallbackId?: string): string | undefined {
  const row = asRecord(value);
  return asString(row?.id) ?? fallbackId;
}

function asEntryMeta(row: Record<string, unknown>, ids?: string[]) {
  const tags = asStringList(row.tags);
  const usedBy = asEdgeList(row.usedBy, ids);
  const producedBy = asEdgeList(row.producedBy, ids);
  const order = asNumber(row.order);
  return {
    ...(tags.length ? { tags } : {}),
    ...(usedBy.length ? { usedBy } : {}),
    ...(producedBy.length ? { producedBy } : {}),
    ...(order !== undefined ? { order } : {}),
  };
}

function asItemEntry(
  value: unknown,
  fallbackId?: string,
  ids?: string[],
): DumpItemEntry | undefined {
  const id = asId(value, fallbackId);
  if (!id) return undefined;
  const row = asRecord(value);
  if (!row) return undefined;
  const rarity = asString(row.rarity);
  const block = asString(row.block);
  const maxCount =
    typeof row.maxCount === 'number' && Number.isFinite(row.maxCount)
      ? row.maxCount
      : undefined;
  const display = asDisplay(row.display);
  const variants = asVariants(row.variants);
  const sprite = asSpriteEntry(row.sprite);
  return {
    id,
    ...(maxCount !== undefined ? { maxCount } : {}),
    ...(rarity ? { rarity } : {}),
    ...(block ? { block } : {}),
    ...(display ? { display } : {}),
    ...(variants ? { variants } : {}),
    ...(sprite ? { sprite } : {}),
    ...asEntryMeta(row, ids),
  };
}

function asBlockEntry(
  value: unknown,
  fallbackId?: string,
  ids?: string[],
): DumpBlockEntry | undefined {
  const id = asId(value, fallbackId);
  if (!id) return undefined;
  const row = asRecord(value);
  if (!row) return undefined;
  const item = asTaggedReference(row.item);
  const display = asDisplay(row.display);
  const sprite = asSpriteEntry(row.sprite);
  return {
    id,
    ...(item ? { item } : {}),
    ...(display ? { display } : {}),
    ...(sprite ? { sprite } : {}),
    ...asEntryMeta(row, ids),
  };
}

function asFluidEntry(
  value: unknown,
  fallbackId?: string,
  ids?: string[],
): DumpFluidEntry | undefined {
  const id = asId(value, fallbackId);
  if (!id) return undefined;
  const row = asRecord(value);
  if (!row) return undefined;
  const display = asDisplay(row.display);
  const variants = asVariants(row.variants);
  const sprite = asSpriteEntry(row.sprite);
  return {
    id,
    ...(display ? { display } : {}),
    ...(variants ? { variants } : {}),
    ...(sprite ? { sprite } : {}),
    ...asEntryMeta(row, ids),
  };
}

function asEntityEntry(
  value: unknown,
  fallbackId?: string,
  ids?: string[],
): DumpEntityEntry | undefined {
  const id = asId(value, fallbackId);
  if (!id) return undefined;
  const row = asRecord(value);
  if (!row) return undefined;
  const display = asDisplay(row.display);
  const texture = asString(row.texture);
  const model = asString(row.model);
  const variants = asVariants(row.variants);
  return {
    id,
    ...(display ? { display } : {}),
    ...(texture ? { texture } : {}),
    ...(model ? { model } : {}),
    ...(variants ? { variants } : {}),
    ...asEntryMeta(row, ids),
  };
}

export function asEntry(
  value: unknown,
  kind: DumpRegistryKind,
  fallbackId?: string,
  ids?: string[],
): DumpRegistryEntry | undefined {
  switch (kind) {
    case 'items':
      return asItemEntry(value, fallbackId, ids);
    case 'blocks':
      return asBlockEntry(value, fallbackId, ids);
    case 'fluids':
      return asFluidEntry(value, fallbackId, ids);
    case 'entities':
      return asEntityEntry(value, fallbackId, ids);
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

