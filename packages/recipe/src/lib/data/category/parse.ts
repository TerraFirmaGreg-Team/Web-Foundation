import { asNumber, asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type {
  DumpLayoutSlot,
  DumpRecipeCategory,
  DumpRecipeLayout,
} from '@terrafirmagreg-team/recipe/lib/data/category/dto';

function asLayoutSlot(value: unknown, key: string): DumpLayoutSlot | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const id = asString(row.id) ?? key;
  if (!id) return undefined;
  const x = asNumber(row.x) ?? 0;
  const y = asNumber(row.y) ?? 0;
  const w = asNumber(row.w) ?? 18;
  const h = asNumber(row.h) ?? 18;
  const role = asString(row.role) ?? 'input';
  return { id, x, y, w, h, role };
}

function asLayout(value: unknown): DumpRecipeLayout | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const w = asNumber(row.w);
  const h = asNumber(row.h);
  if (w === undefined || h === undefined) return undefined;
  const scale = asNumber(row.scale);
  const margin = asNumber(row.margin);
  const image = asString(row.image);
  const slotsRow = asRecord(row.slots);
  const slots = Object.entries(slotsRow ?? {}).flatMap(([key, item]) => {
    const slot = asLayoutSlot(item, key);
    return slot ? [slot] : [];
  });
  return {
    w,
    h,
    ...(scale !== undefined ? { scale } : {}),
    ...(margin !== undefined ? { margin } : {}),
    ...(image ? { image } : {}),
    slots,
  };
}

export function asCategory(value: unknown): DumpRecipeCategory | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const id = asString(row.id);
  if (!id) return undefined;
  const display = asDisplay(row.display);
  const order = asNumber(row.order) ?? 0;
  const icon = asTaggedReference(row.icon);
  const workstations = Array.isArray(row.workstations)
    ? row.workstations.flatMap((item) => {
        const ref = asTaggedReference(item);
        return ref ? [ref] : [];
      })
    : undefined;
  const layout = asLayout(row.layout);
  return {
    id,
    order,
    ...(display ? { display } : {}),
    ...(icon ? { icon } : {}),
    ...(workstations && workstations.length > 0 ? { workstations } : {}),
    ...(layout ? { layout } : {}),
  };
}

