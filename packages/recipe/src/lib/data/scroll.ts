import {
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';

export type RecipeScroll = {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: 'vertical' | 'horizontal';
  contentH: number;
  contentW: number;
};

export function recipeScroll(
  properties: Record<string, unknown> | undefined,
): RecipeScroll | undefined {
  const raw = asRecord(properties?.scroll);
  if (!raw) return undefined;
  const x = asNumber(raw.x);
  const y = asNumber(raw.y);
  const w = asNumber(raw.w);
  const h = asNumber(raw.h);
  const contentH = asNumber(raw.contentH) ?? 0;
  const contentW = asNumber(raw.contentW) ?? 0;
  if (x === undefined || y === undefined || !w || !h) return undefined;
  if (contentH <= h && contentW <= w) return undefined;
  const axis = asString(raw.axis) === 'horizontal' ? 'horizontal' : 'vertical';
  return { x, y, w, h, axis, contentH, contentW };
}
