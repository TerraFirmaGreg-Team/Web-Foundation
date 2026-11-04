import type { DumpRecipeLayout } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import type { RecipeSlotType } from '@terrafirmagreg-team/recipe/lib/data/dto';

export function outputBoundary(
  slots: Readonly<
    Record<string, { type?: unknown; x?: unknown } | undefined>
  >,
  layout?: DumpRecipeLayout,
): number {
  const byId = layout
    ? new Map(layout.slots.map((slot) => [slot.id, slot]))
    : undefined;
  let bound = Number.POSITIVE_INFINITY;
  for (const [id, slot] of Object.entries(slots)) {
    if (slot?.type !== 'output') continue;
    const x = typeof slot.x === 'number' ? slot.x : byId?.get(id)?.x;
    if (typeof x === 'number') bound = Math.min(bound, x);
  }
  if (!Number.isFinite(bound) && byId) {
    for (const slot of byId.values()) {
      if (slot.role === 'output' && typeof slot.x === 'number') {
        bound = Math.min(bound, slot.x);
      }
    }
  }
  if (!Number.isFinite(bound)) {
    bound = layout?.w ? layout.w / 2 : Number.POSITIVE_INFINITY;
  }
  return bound;
}

export function slotIoRole(
  type: RecipeSlotType,
  x: number | undefined,
  boundary: number,
): 'input' | 'output' | 'catalyst' {
  if (type === 'output') return 'output';
  if (type === 'catalyst') return 'catalyst';
  if (type === 'tank') {
    return typeof x === 'number' && x >= boundary ? 'output' : 'input';
  }
  return 'input';
}

