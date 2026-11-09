import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';

export const MC_FORMAT_COLORS: Record<string, string> = {
  '0': '#000000',
  '1': '#0000aa',
  '2': '#00aa00',
  '3': '#00aaaa',
  '4': '#aa0000',
  '5': '#aa00aa',
  '6': '#ffaa00',
  '7': '#aaaaaa',
  '8': '#555555',
  '9': '#5555ff',
  a: '#55ff55',
  b: '#55ffff',
  c: '#ff5555',
  d: '#ff55ff',
  e: '#ffff55',
  f: '#ffffff',
};

export const MC_FORMAT = {
  marker: '§',
  extraMarkers: ['&'],
  colors: MC_FORMAT_COLORS,
  styles: {
    l: { fontWeight: 600 },
    o: { fontStyle: 'italic' },
    n: { textDecoration: 'underline' },
    m: { textDecoration: 'line-through' },
  },
  reset: 'r',
  hex: 'x',
  ignore: ['k'],
} as const;

export type DumpText = {
  translate?: string;
  text?: string;
  keybind?: string;
  with?: DumpText[];
  extra?: DumpText[];
};

export type DumpDisplay = {
  name?: string;
  tooltip?: DumpText[];

  tooltipMods?: Record<string, DumpText[]>;
};

export function asDumpText(value: unknown): DumpText | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const translate = asString(row.translate);
  const text = typeof row.text === 'string' ? row.text : undefined;
  const keybind = asString(row.keybind);
  const withParts = asDumpTextList(row.with);
  const extra = asDumpTextList(row.extra);
  if (!translate && text === undefined && !keybind && !withParts && !extra) {
    return undefined;
  }
  return {
    ...(translate ? { translate } : {}),
    ...(text !== undefined ? { text } : {}),
    ...(keybind ? { keybind } : {}),
    ...(withParts ? { with: withParts } : {}),
    ...(extra ? { extra } : {}),
  };
}

export function asDumpTextList(value: unknown): DumpText[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.flatMap((item) => {
    const text = asDumpText(item);
    return text ? [text] : [];
  });
  return out.length ? out : undefined;
}

export function asDisplay(value: unknown): DumpDisplay | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const name = asString(row.name);
  const tooltip = asDumpTextList(row.tooltip);
  const modsRow = asRecord(row.tooltipMods);
  const tooltipMods = modsRow
    ? Object.fromEntries(
        Object.entries(modsRow).flatMap(([mod, lines]) => {
          const list = asDumpTextList(lines);
          return list ? [[mod, list] as const] : [];
        }),
      )
    : undefined;
  if (!name && !tooltip && !tooltipMods) return undefined;
  return {
    ...(name ? { name } : {}),
    ...(tooltip ? { tooltip } : {}),
    ...(tooltipMods && Object.keys(tooltipMods).length ? { tooltipMods } : {}),
  };
}

