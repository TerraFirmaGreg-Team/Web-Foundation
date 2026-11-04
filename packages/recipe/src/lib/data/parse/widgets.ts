import { asNumber, asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asDumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { RecipeWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';

function parseDecorWidget(value: unknown): RecipeWidget | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const type = asString(row.type);
  const x = asNumber(row.x);
  const y = asNumber(row.y);
  const w = asNumber(row.w);
  const h = asNumber(row.h);
  if (!type || x === undefined || y === undefined) return undefined;
  const tooltip = Array.isArray(row.tooltip)
    ? row.tooltip.flatMap((line) => {
        const text = asString(line);
        return text ? [text] : [];
      })
    : undefined;
  const box = { x, y, w: w ?? 0, h: h ?? 0 };
  const tip = tooltip?.length ? { tooltip } : {};
  if (type === 'text') {
    const component = asDumpText(row.component);
    const text = asString(row.text) ?? (component ? '' : undefined);
    if (text === undefined) return undefined;
    const color = asNumber(row.color);
    const shadow = typeof row.shadow === 'boolean' ? row.shadow : undefined;
    return {
      type,
      ...box,
      text,
      ...(component ? { component } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(shadow !== undefined ? { shadow } : {}),
      ...tip,
    };
  }
  if (type === 'texture' || type === 'animated') {
    const texture = asString(row.texture);
    if (!texture) return undefined;
    const u = asNumber(row.u);
    const v = asNumber(row.v);
    const regionW = asNumber(row.regionW);
    const regionH = asNumber(row.regionH);
    const time = asNumber(row.time);
    const horizontal =
      typeof row.horizontal === 'boolean' ? row.horizontal : undefined;
    return {
      type,
      ...box,
      texture,
      ...(u !== undefined ? { u } : {}),
      ...(v !== undefined ? { v } : {}),
      ...(regionW !== undefined ? { regionW } : {}),
      ...(regionH !== undefined ? { regionH } : {}),
      ...(time !== undefined ? { time } : {}),
      ...(horizontal !== undefined ? { horizontal } : {}),
      ...(typeof row.endToStart === 'boolean' ? { endToStart: row.endToStart } : {}),
      ...(typeof row.fullToEmpty === 'boolean'
        ? { fullToEmpty: row.fullToEmpty }
        : {}),
      ...(asNumber(row.textureW) !== undefined
        ? { textureW: asNumber(row.textureW) }
        : {}),
      ...(asNumber(row.textureH) !== undefined
        ? { textureH: asNumber(row.textureH) }
        : {}),
      ...tip,
    };
  }
  return { type: 'widget', ...box, ...tip };
}

export function parseDecorWidgets(value: unknown): RecipeWidget[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const widget = parseDecorWidget(item);
    return widget ? [widget] : [];
  });
}

