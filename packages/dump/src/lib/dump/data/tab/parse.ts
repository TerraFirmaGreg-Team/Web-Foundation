import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTaggedReference, compactRefId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asDisplay } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { DumpCreativeTab } from '@terrafirmagreg-team/dump/lib/dump/data/tab/dto';

export function asTab(value: unknown): DumpCreativeTab | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const id = asString(row.id);
  const display = asDisplay(row.display);
  const name = display?.name;
  if (!id || !name) return undefined;
  const order =
    typeof row.order === 'number' && Number.isFinite(row.order) ? row.order : 0;
  const icon = asTaggedReference(row.icon);
  return { id, order, display: { ...display, name }, ...(icon ? { icon } : {}) };
}

export function asTabItems(value: unknown): string[] {
  const row = asRecord(value);
  if (!row || !Array.isArray(row.items)) return [];
  return row.items.flatMap((item) => {
    const id = compactRefId(item);
    return id ? [id] : [];
  });
}

