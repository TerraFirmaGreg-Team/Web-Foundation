import {
  asTaggedReference,
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asNumber, asRecord } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type {
  IngredientKind,
  RecipeSlotFill,
  RecipeSlotType,
} from '@terrafirmagreg-team/recipe/lib/data/dto';
import { RECIPE_SLOT_TYPES } from '@terrafirmagreg-team/recipe/lib/data/dto';

function asSlotType(value: unknown): RecipeSlotType | undefined {
  return typeof value === 'string' &&
    (RECIPE_SLOT_TYPES as readonly string[]).includes(value)
    ? (value as RecipeSlotType)
    : undefined;
}

export function kindFromRef(ref: TaggedReference): IngredientKind {
  switch (ref.kind) {
    case 'fluid':
      return 'fluid';
    case 'itemTag':
    case 'blockTag':
    case 'fluidTag':
    case 'entityTag':
      return 'tag';
    default:
      return 'item';
  }
}

export function tagKindFromRef(ref: TaggedReference): string | undefined {
  return ref.kind.endsWith('Tag')
    ? ref.kind.slice(0, -'Tag'.length)
    : undefined;
}

function parseSlotFill(value: unknown): RecipeSlotFill | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const type = asSlotType(row.type);
  const ref = asTaggedReference(row.ref);
  const amount = asNumber(row.amount);
  if (!type || !ref || amount === undefined) return undefined;
  const chance = asNumber(row.chance);
  const x = asNumber(row.x);
  const y = asNumber(row.y);
  const w = asNumber(row.w);
  const h = asNumber(row.h);
  const alternatives = Array.isArray(row.alternatives)
    ? row.alternatives.flatMap((item) => {
        const tagged = asTaggedReference(item);
        return tagged ? [tagged] : [];
      })
    : undefined;
  return {
    type,
    ref,
    amount,
    ...(chance !== undefined ? { chance } : {}),
    kind: kindFromRef(ref),
    id: stackIdFromRef(ref),
    count: amount,
    ...(x !== undefined ? { x } : {}),
    ...(y !== undefined ? { y } : {}),
    ...(w !== undefined ? { w } : {}),
    ...(h !== undefined ? { h } : {}),
    ...(alternatives?.length ? { alternatives } : {}),
  };
}

export function parseSlots(value: unknown): Record<string, RecipeSlotFill> {
  const row = asRecord(value);
  if (!row) return {};
  const out: Record<string, RecipeSlotFill> = {};
  for (const [slotId, fill] of Object.entries(row)) {
    const parsed = parseSlotFill(fill);
    if (parsed) out[slotId] = parsed;
  }
  return out;
}

