'use client';

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import type {
  ScrollBarSkin,
  ScrollBarSkinPiece,
} from '@terrafirmagreg-team/recipe/lib/data/scroll';

type SkinRender = {
  tex: string;
  atlasW: number;
  atlasH: number;
  skin: ScrollBarSkin;
  viewSpan: number;
  contentSpan: number;
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`scrollbar skin: ${src}`));
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}

function slices(piece: ScrollBarSkinPiece): [number, number, number, number] {
  const s = piece.s;
  return Array.isArray(s) ? [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0, s[3] ?? 0] : [s, s, s, s];
}

function tile(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  scale: number,
) {
  if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) return;
  const tileW = sw * scale;
  const tileH = sh * scale;
  for (let yy = 0; yy < dh; yy += tileH) {
    const hh = Math.min(tileH, dh - yy);
    for (let xx = 0; xx < dw; xx += tileW) {
      const ww = Math.min(tileW, dw - xx);
      ctx.drawImage(img, sx, sy, ww / scale, hh / scale, dx + xx, dy + yy, ww, hh);
    }
  }
}

function drawNineSlice(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  piece: ScrollBarSkinPiece,
  w: number,
  h: number,
  scale: number,
) {
  const [l, t, r, b] = slices(piece);
  const sl = l * scale;
  const st = t * scale;
  const sr = r * scale;
  const sb = b * scale;
  const u = piece.u;
  const v = piece.v;
  const pw = piece.w;
  const ph = piece.h;
  tile(ctx, img, u, v, l, t, 0, 0, sl, st, scale);
  tile(ctx, img, u + l, v, pw - l - r, t, sl, 0, w - sl - sr, st, scale);
  tile(ctx, img, u + pw - r, v, r, t, w - sr, 0, sr, st, scale);
  tile(ctx, img, u, v + t, l, ph - t - b, 0, st, sl, h - st - sb, scale);
  tile(ctx, img, u + l, v + t, pw - l - r, ph - t - b, sl, st, w - sl - sr, h - st - sb, scale);
  tile(ctx, img, u + pw - r, v + t, r, ph - t - b, w - sr, st, sr, h - st - sb, scale);
  tile(ctx, img, u, v + ph - b, l, b, 0, h - sb, sl, sb, scale);
  tile(ctx, img, u + l, v + ph - b, pw - l - r, b, sl, h - sb, w - sl - sr, sb, scale);
  tile(ctx, img, u + pw - r, v + ph - b, r, b, w - sr, h - sb, sr, sb, scale);
}

function NineSlice({
  tex,
  piece,
  x,
  y,
  w,
  h,
  scale,
}: {
  tex: string;
  atlasW: number;
  atlasH: number;
  piece: ScrollBarSkinPiece;
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cw = Math.max(1, Math.round(w));
  const ch = Math.max(1, Math.round(h));
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let stale = false;
    void loadImage(tex)
      .then((img) => {
        if (stale) return;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawNineSlice(ctx, img, piece, canvas.width, canvas.height, scale);
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [tex, piece, cw, ch, scale]);
  return (
    <canvas
      ref={ref}
      aria-hidden
      width={cw}
      height={ch}
      className="absolute block [image-rendering:pixelated]"
      style={{ left: x, top: y, width: cw, height: ch }}
    />
  );
}

export function CardScrollbar({
  left,
  top,
  w,
  h,
  axis,
  thumbRatio,
  position,
  scale,
  onScroll,
  controlsId,
  skin,
}: {
  left: number;
  top: number;
  w: number;
  h: number;
  axis: 'vertical' | 'horizontal';
  thumbRatio: number;
  position: number;
  scale: number;
  onScroll: (position: number) => void;
  controlsId?: string;
  skin?: SkinRender;
}) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ pointer: number; position: number } | null>(null);
  const vertical = axis === 'vertical';
  const trackLen = vertical ? h : w;
  const gameThumb = skin
    ? Math.max(
        14 * scale,
        Math.round(
          (trackLen - 2 * scale) *
            Math.min(1, skin.viewSpan / Math.max(1, skin.contentSpan)),
        ),
      )
    : 0;
  const thumbLen = skin
    ? gameThumb
    : Math.max(4 * scale, trackLen * Math.min(1, Math.max(0, thumbRatio)));
  const pad = scale;
  const travel = Math.max(
    1,
    trackLen - thumbLen - (skin ? 2 * pad : 0),
  );
  const thumbPos = skin
    ? pad + Math.round((trackLen - 2 * pad - thumbLen) * Math.max(0, Math.min(1, position)))
    : Math.max(0, Math.min(1, position)) * travel;

  const pointerPosition = (event: PointerEvent) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const pointer = vertical ? event.clientY - rect.top : event.clientX - rect.left;
    return Math.max(0, Math.min(1, (pointer - (skin ? pad : 0) - thumbLen / 2) / travel));
  };

  const stepBy = (dir: -1 | 1) => onScroll(Math.max(0, Math.min(1, position + dir * 0.15)));

  const onKeyDown = (event: KeyboardEvent) => {
    const forward = vertical ? 'ArrowDown' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : 'ArrowLeft';
    if (event.key === forward) {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === back) {
      event.preventDefault();
      stepBy(-1);
    }
  };

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      aria-label={t('Scroll', { note: 'ui.scroll' })}
      aria-controls={controlsId}
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-valuenow={Math.round(position * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        const pointer = vertical ? event.clientY : event.clientX;
        const rect = trackRef.current?.getBoundingClientRect();
        const trackPointer = rect
          ? (vertical ? event.clientY - rect.top : event.clientX - rect.left)
          : null;
        const pos = pointerPosition(event);
        if (pos !== null && trackPointer !== null) {
          const inside =
            trackPointer >= thumbPos && trackPointer <= thumbPos + thumbLen;
          if (!inside) {
            dragOrigin.current = { pointer, position: pos };
            onScroll(pos);
            return;
          }
        }
        dragOrigin.current = { pointer, position };
      }}
      onPointerMove={(event) => {
        const origin = dragOrigin.current;
        if (!origin) return;
        const pointer = vertical ? event.clientY : event.clientX;
        const delta = pointer - origin.pointer;
        onScroll(Math.max(0, Math.min(1, origin.position + delta / travel)));
      }}
      onPointerUp={(event) => {
        dragOrigin.current = null;
        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        dragOrigin.current = null;
      }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
      className="absolute cursor-default outline-none focus-visible:ring-1 focus-visible:ring-ring"
      style={{
        left,
        top,
        width: w,
        height: h,
        ...(skin
          ? undefined
          : {
              background: 'var(--color-mc-inset)',
              ...(vertical
                ? {
                    borderLeft: '1px solid var(--color-mc-bevel-dark)',
                    borderRight: '1px solid var(--color-mc-bevel-light)',
                  }
                : {
                    borderTop: '1px solid var(--color-mc-bevel-dark)',
                    borderBottom: '1px solid var(--color-mc-bevel-light)',
                  }),
            }),
      }}
    >
      {skin ? (
        <>
          <NineSlice
            tex={skin.tex}
            atlasW={skin.atlasW}
            atlasH={skin.atlasH}
            piece={skin.skin.track}
            x={0}
            y={0}
            w={w}
            h={h}
            scale={scale}
          />
          {vertical ? (
            <NineSlice
              tex={skin.tex}
              atlasW={skin.atlasW}
              atlasH={skin.atlasH}
              piece={skin.skin.thumb}
              x={pad}
              y={thumbPos}
              w={Math.max(2, w - pad * 2)}
              h={thumbLen}
              scale={scale}
            />
          ) : (
            <span
              className="absolute block"
              style={{
                left: thumbPos,
                top: pad,
                width: thumbLen,
                height: Math.max(2, h - pad * 2),
              }}
            >
              <span
                className="absolute block"
                style={{
                  left: (thumbLen - Math.max(2, h - pad * 2)) / 2 + Math.max(2, h - pad * 2),
                  top: (Math.max(2, h - pad * 2) - thumbLen) / 2,
                  width: Math.max(2, h - pad * 2),
                  height: thumbLen,
                  transform: 'rotate(90deg) scaleY(-1)',
                  transformOrigin: 'left top',
                }}
              >
                <NineSlice
                  tex={skin.tex}
                  atlasW={skin.atlasW}
                  atlasH={skin.atlasH}
                  piece={skin.skin.thumb}
                  x={0}
                  y={0}
                  w={Math.max(2, h - pad * 2)}
                  h={thumbLen}
                  scale={scale}
                />
              </span>
            </span>
          )}
        </>
      ) : (
        <span
          aria-hidden
          className="absolute block"
          style={{
            left: vertical ? pad : thumbPos + pad,
            top: vertical ? thumbPos + pad : pad,
            width: vertical ? Math.max(2, w - pad * 2) : Math.max(2, thumbLen - pad * 2),
            height: vertical ? Math.max(2, thumbLen - pad * 2) : Math.max(2, h - pad * 2),
            background: 'var(--color-mc-paper)',
            boxShadow: `inset 0 ${scale}px 0 var(--color-mc-shadow), inset 0 -${scale}px 0 var(--color-mc-bevel-dark)`,
          }}
        />
      )}
    </div>
  );
}
