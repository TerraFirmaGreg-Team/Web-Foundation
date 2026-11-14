'use client';

import { McText } from '@terrafirmagreg-team/game/components/entry/mc-text';
import { dumpTextString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import type { RecipeTextWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';

export function CardText({
  widget,
  offX = 0,
  offY = 0,
  scale,
  langMap,
  anchor,
  size,
}: {
  widget: RecipeTextWidget;
  offX?: number;
  offY?: number;
  scale: number;
  langMap?: Record<string, string>;
  anchor?: { x: number; y: number; w: number };
  size?: number;
}) {
  const content = widget.component
    ? dumpTextString(langMap ?? {}, widget.component) || widget.text
    : widget.text;
  if (!content) return null;
  const wrap = widget.type === 'paragraph';
  const rgb = widget.color === undefined ? 0xffffff : widget.color & 0xffffff;
  const shadowRgb = ((rgb & 0xfcfcfc) >> 2) & 0xffffff;
  const shadowed = widget.shadow === true;
  return (
    <span
      className={`font-mc pointer-events-none absolute leading-none ${wrap ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}
      style={{
        ...(anchor
          ? {
              left: (anchor.x + offX) * scale,
              top: (anchor.y + offY) * scale,
              width: anchor.w * scale,
              textAlign: 'right' as const,
            }
          : {
              left: (widget.x + offX) * scale,
              top: (widget.y + offY) * scale,
              ...(wrap ? { width: widget.w * scale } : {}),
            }),
        fontSize: size ?? 8 * scale,
        color: `#${rgb.toString(16).padStart(6, '0')}`,
        ...(shadowed
          ? {
              textShadow: `${scale}px ${scale}px 0 #${shadowRgb.toString(16).padStart(6, '0')}`,
            }
          : {}),
      }}
    >
      <McText text={content} surface="dark" />
    </span>
  );
}

