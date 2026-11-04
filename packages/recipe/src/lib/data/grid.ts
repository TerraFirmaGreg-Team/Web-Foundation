import {
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type { RecipeGrid, RecipeGridMember } from '@terrafirmagreg-team/recipe/lib/data/dto';

export function recipeGrid(
  properties: Record<string, unknown> | undefined,
): { grid: RecipeGrid; members: RecipeGridMember[] } | undefined {
  const raw = asRecord(properties?.grid);
  if (!raw) return undefined;
  const y = asNumber(raw.y);
  const row = asNumber(raw.row);
  const cols = asNumber(raw.cols);
  const rows = asNumber(raw.rows);
  if (y === undefined || !row || !cols || !rows) return undefined;
  const members = Array.isArray(properties?.members)
    ? properties.members.flatMap((item) => {
        const record = asRecord(item);
        const id = asString(record?.id ?? item);
        if (!id) return [];
        const kind = asString(record?.kind);
        const amount = asNumber(record?.amount);
        const chance = asNumber(record?.chance);
        return [
          {
            id,
            ...(kind ? { kind } : {}),
            ...(amount !== undefined ? { amount } : {}),
            ...(chance !== undefined ? { chance } : {}),
          },
        ];
      })
    : [];
  if (!members.length) return undefined;
  const tail = asNumber(raw.tail) ?? 0;
  return { grid: { y, row, tail, cols, rows }, members };
}

