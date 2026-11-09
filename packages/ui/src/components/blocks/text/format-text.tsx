import { Fragment, type CSSProperties } from 'react';
import {
  readableColor,
  type ColorSurface,
} from '@terrafirmagreg-team/ui/lib/color';

export type TextFormat = {
  marker: string;
  extraMarkers?: readonly string[];
  colors: Record<string, string>;
  styles?: Record<string, CSSProperties>;
  reset?: string;
  hex?: string;
  ignore?: readonly string[];
};

type Run = { text: string; style?: CSSProperties };

export function FormatText({
  text,
  format,
  surface = 'normal',
}: {
  text: string;
  format: TextFormat;
  surface?: ColorSurface;
}) {
  const markers = new Set([format.marker, ...(format.extraMarkers ?? [])]);
  const codes = new Set([
    ...Object.keys(format.colors),
    ...Object.keys(format.styles ?? {}),
    ...(format.reset ? [format.reset] : []),
    ...(format.ignore ?? []),
  ]);
  const runs: Run[] = [];
  let style: CSSProperties | undefined;
  let buf = '';
  const flush = () => {
    if (!buf) return;
    runs.push(style ? { text: buf, style } : { text: buf });
    buf = '';
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (!markers.has(ch!)) {
      buf += ch;
      continue;
    }
    const code = text[i + 1]?.toLowerCase();
    if (format.hex && code === format.hex) {
      let hex = '';
      let j = i + 2;
      while (
        hex.length < 6 &&
        markers.has(text[j]!) &&
        /^[0-9a-f]$/.test(text[j + 1]?.toLowerCase() ?? '')
      ) {
        hex += (text[j + 1] ?? '').toLowerCase();
        j += 2;
      }
      if (hex.length === 6) {
        flush();
        i = j - 1;
        const next: CSSProperties = { ...(style ?? {}), color: `#${hex}` };
        delete next.fontWeight;
        delete next.fontStyle;
        delete next.textDecoration;
        style = next;
        continue;
      }
      buf += ch;
      continue;
    }
    if (code === undefined || !codes.has(code)) {
      buf += ch;
      continue;
    }
    flush();
    i += 1;
    if (code === format.reset) {
      style = undefined;
      continue;
    }
    const next: CSSProperties = { ...(style ?? {}) };
    const color = format.colors[code];
    if (color) {
      next.color = color;
      delete next.fontWeight;
      delete next.fontStyle;
      delete next.textDecoration;
    }
    const extra = format.styles?.[code];
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (key === 'textDecoration' && next.textDecoration) {
          next.textDecoration = `${next.textDecoration} ${String(value)}`;
        } else {
          (next as Record<string, unknown>)[key] = value;
        }
      }
    }
    style = Object.keys(next).length ? next : undefined;
  }
  flush();
  return (
    <>
      {runs.map((run, index) =>
        run.style ? (
          <span
            key={index}
            style={
              run.style.color
                ? { ...run.style, color: readableColor(run.style.color, surface) }
                : run.style
            }
          >
            {run.text}
          </span>
        ) : (
          <Fragment key={index}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}
