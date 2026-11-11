import {
  asBool,
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import {
  asTaggedReference,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export type ScrollRect = { x: number; y: number; w: number; h: number };

export type ScrollBarSkinPiece = {
  u: number;
  v: number;
  w: number;
  h: number;
  s: number | number[];
};

export type ScrollBarSkin = {
  track: ScrollBarSkinPiece;
  thumb: ScrollBarSkinPiece;
};

export type ScrollFrame = {
  tex: string;
  u: number;
  v: number;
  s: number;
  t: number;
};

export type ScrollElement = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'slot' | 'text' | 'block' | 'entity';
  ref?: TaggedReference;
  base?: TaggedReference;
  mark?: boolean;
  tooltip?: string[];
  label?: string;
  text?: string;
  color?: number;
  pin?: boolean;
  u?: number;
  v?: number;
};

export type RecipeScroll = {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: 'vertical' | 'horizontal';
  contentH: number;
  contentW: number;
  bar?: ScrollRect;
  viewport?: ScrollRect;
  clipTop?: number;
  guiTex?: string;
  barSkin?: ScrollBarSkin;
  frame?: ScrollFrame;
  slotTex?: string;
  overlay?: string;
  overlayW?: number;
  overlayH?: number;
  decomposed?: boolean;
  elements?: ScrollElement[];
};

function scrollRect(value: unknown): ScrollRect | undefined {
  const raw = asRecord(value);
  if (!raw) return undefined;
  const x = asNumber(raw.x);
  const y = asNumber(raw.y);
  const w = asNumber(raw.w);
  const h = asNumber(raw.h);
  if (x === undefined || y === undefined || !w || !h) return undefined;
  return { x, y, w, h };
}

function skinPiece(value: unknown): ScrollBarSkinPiece | undefined {
  const raw = asRecord(value);
  if (!raw) return undefined;
  const u = asNumber(raw.u);
  const v = asNumber(raw.v);
  const w = asNumber(raw.w);
  const h = asNumber(raw.h);
  if (u === undefined || v === undefined || !w || !h) return undefined;
  const s = raw.s;
  const slices = Array.isArray(s)
    ? s.map(asNumber).filter((n): n is number => n !== undefined)
    : (asNumber(s) ?? 0);
  return { u, v, w, h, s: slices };
}

function scrollFrame(value: unknown): ScrollFrame | undefined {
  const raw = asRecord(value);
  if (!raw) return undefined;
  const tex = asString(raw.tex);
  const u = asNumber(raw.u);
  const v = asNumber(raw.v);
  const s = asNumber(raw.s);
  const t = asNumber(raw.t);
  if (!tex || u === undefined || v === undefined || !s || !t) return undefined;
  return { tex, u, v, s, t };
}

function scrollElement(value: unknown): ScrollElement | undefined {
  const raw = asRecord(value);
  if (!raw) return undefined;
  const x = asNumber(raw.x);
  const y = asNumber(raw.y);
  if (x === undefined || y === undefined) return undefined;
  const kind = asString(raw.kind);
  if (
    kind !== 'slot' &&
    kind !== 'text' &&
    kind !== 'block' &&
    kind !== 'entity'
  )
    return undefined;
  const w = asNumber(raw.w);
  const h = asNumber(raw.h);
  return {
    x,
    y,
    w: w ?? 18,
    h: h ?? 18,
    kind,
    ref: asTaggedReference(raw.ref),
    base: asTaggedReference(raw.base),
    mark: asBool(raw.mark) === true || undefined,
    tooltip: Array.isArray(raw.tooltip)
      ? raw.tooltip
          .map(asString)
          .filter((line): line is string => line !== undefined && line.length > 0)
      : undefined,
    label: asString(raw.label),
    text: asString(raw.text),
    color: asNumber(raw.color),
    pin: asBool(raw.pin) === true || undefined,
    u: asNumber(raw.u),
    v: asNumber(raw.v),
  };
}

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
  const axis = asString(raw.axis) === 'horizontal' ? 'horizontal' : 'vertical';
  const rawSkin = asRecord(raw.barSkin);
  const barSkin =
    rawSkin !== undefined
      ? {
          track: skinPiece(rawSkin.track),
          thumb: skinPiece(rawSkin.thumb),
        }
      : undefined;
  const elements = Array.isArray(raw.elements)
    ? raw.elements
        .map(scrollElement)
        .filter((el): el is ScrollElement => el !== undefined)
    : undefined;
  return {
    x,
    y,
    w,
    h,
    axis,
    contentH,
    contentW,
    bar: scrollRect(raw.bar),
    viewport: scrollRect(raw.viewport),
    clipTop: asNumber(raw.clipTop) || undefined,
    guiTex: asString(raw.guiTex),
    barSkin:
      barSkin?.track !== undefined && barSkin.thumb !== undefined
        ? { track: barSkin.track, thumb: barSkin.thumb }
        : undefined,
    frame: scrollFrame(raw.frame),
    slotTex: asString(raw.slotTex),
    overlay: asString(raw.overlay),
    overlayW: asNumber(raw.overlayW),
    overlayH: asNumber(raw.overlayH),
    decomposed: asBool(raw.decomposed) === true || undefined,
    elements: elements && elements.length > 0 ? elements : undefined,
  };
}
