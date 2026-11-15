'use client';

import { McText } from '@terrafirmagreg-team/game/components/entry/mc-text';
import { dumpTextString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { Marquee } from '@terrafirmagreg-team/ui/components/blocks/text/marquee';
import { widgetTextColor } from '@terrafirmagreg-team/recipe/lib/cards/model';
import type { RecipeTextWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';

const LEFT_INSET = 1;

export function CardText({
  widget,
  offX = 0,
  offY = 0,
  scale,
  langMap,
  anchor,
  size,
  rightGui,
}: {
  widget: RecipeTextWidget;
  offX?: number;
  offY?: number;
  scale: number;
  langMap?: Record<string, string>;
  anchor?: { x: number; y: number; w: number };
  size?: number;
  rightGui?: number;
}) {
  const content = widget.component
    ? dumpTextString(langMap ?? {}, widget.component) || widget.text
    : widget.text;
  if (!content) return null;
  const wrap = widget.type === 'paragraph';
  const rgb = widgetTextColor(widget.color, widget.shadow === true);
  const shadowRgb = ((rgb & 0xfcfcfc) >> 2) & 0xffffff;
  const relX = widget.x + offX;
  const clamped = !anchor && !wrap && rightGui !== undefined;
  const leftGui = clamped ? Math.max(relX, LEFT_INSET) : relX;
  const widthGui = clamped
    ? Math.max(rightGui - leftGui, 0)
    : widget.w;
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
              left: leftGui * scale,
              top: (widget.y + offY) * scale,
              ...(wrap || clamped ? { width: widthGui * scale } : {}),
            }),
        fontSize: size ?? 8 * scale,
        fontWeight: 700,
        color: `#${rgb.toString(16).padStart(6, '0')}`,
        ...(widget.shadow === true
          ? {
              textShadow: `${scale / 2}px ${scale / 2}px 0 #${shadowRgb.toString(16).padStart(6, '0')}`,
            }
          : {}),
      }}
    >
      {clamped ? (
        <Marquee>
          <McText text={content} surface="normal" />
        </Marquee>
      ) : (
        <McText text={content} surface="normal" />
      )}
    </span>
  );
}
