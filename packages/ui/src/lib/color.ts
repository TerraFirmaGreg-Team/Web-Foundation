const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i;

const MAX_LUMA = 0.62;
const MIN_LUMA = 0.52;

export type ColorSurface = 'normal' | 'inverted' | 'light' | 'dark';

const parse = (hex: string): [number, number, number] | null => {
  if (!HEX.test(hex)) return null;
  const h = hex.slice(1);
  const v = Number.parseInt(
    h.length === 3 ? [...h].map((c) => c + c).join('') : h,
    16,
  );
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
};

const luma = ([r, g, b]: [number, number, number]) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const toHex = (rgb: [number, number, number]) =>
  `#${rgb
    .map((n) =>
      Math.round(Math.min(255, Math.max(0, n)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

const cap = (rgb: [number, number, number]) => {
  const y = luma(rgb);
  if (y <= MAX_LUMA) return toHex(rgb);
  return toHex(rgb.map((c) => (c * MAX_LUMA) / y) as [number, number, number]);
};

const lift = (rgb: [number, number, number]) => {
  const y = luma(rgb);
  if (y >= MIN_LUMA || y >= 1) return toHex(rgb);
  const t = (MIN_LUMA - y) / (1 - y);
  return toHex(rgb.map((c) => c + (255 - c) * t) as [number, number, number]);
};

export function readableColor(hex: string, surface: ColorSurface = 'normal') {
  const rgb = parse(hex);
  if (!rgb) return hex;
  const forLight = cap(rgb);
  const forDark = lift(rgb);
  if (surface === 'light') return forLight;
  if (surface === 'dark') return forDark;
  if (forLight === toHex(rgb) && forDark === toHex(rgb)) return hex;
  return surface === 'inverted'
    ? `light-dark(${forDark}, ${forLight})`
    : `light-dark(${forLight}, ${forDark})`;
}
