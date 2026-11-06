'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Fragment, useRef, useState } from 'react';
import { SlotHitbox } from '@terrafirmagreg-team/recipe/components/cards/slot-hitbox';
import { CardText } from '@terrafirmagreg-team/recipe/components/cards/card/text';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import type { CardStripGeo } from '@terrafirmagreg-team/recipe/lib/cards/model';
import type { EntryTooltipLevel } from '@terrafirmagreg-team/game/components/entry/tooltip';
import type { RecipeTextWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

export function CardStrip({
  geo,
  texts,
  margin,
  scale,
  contentGuiW,
  dataset,
  lang,
  langMap,
  nav,
  interactive,
  tooltipLevel,
}: {
  geo: CardStripGeo;
  texts: RecipeTextWidget[];
  margin: number;
  scale: number;
  contentGuiW: number;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  nav?: Pick<RecipeHrefOpts, 'tab' | 'search'>;
  interactive?: boolean;
  tooltipLevel?: EntryTooltipLevel;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const barDrag = useRef<{ x: number; left: number } | null>(null);
  const [stripScroll, setStripScroll] = useState(0);
  const trackW = Math.max((contentGuiW - 8) * scale, 0);
  const totalW = (geo.right + 2) * scale;
  const maxScroll = Math.max(totalW - contentGuiW * scale, 1);
  const thumbW = Math.max(
    16,
    trackW * Math.min(1, (contentGuiW * scale) / totalW),
  );
  const thumbX =
    (stripScroll / maxScroll) * Math.max(trackW - thumbW, 0);
  return (
    <>
      <div
        aria-hidden
        className="absolute bg-mc-panel"
        style={{
          left: (margin + 3) * scale,
          top: (geo.top + margin - 1) * scale,
          width: (contentGuiW - 6) * scale,
          height: Math.max(geo.patchBottom - (geo.top + margin - 1), 0) * scale,
        }}
      />
      <div
        ref={stripRef}
        className="recipe-strip absolute overflow-x-auto overflow-y-hidden select-none"
        style={{
          left: margin * scale,
          top: (geo.top + margin) * scale,
          width: contentGuiW * scale,
          height: (geo.bottom - geo.top + 2) * scale,
          touchAction: 'pan-y',
        }}
        onScroll={(event) => setStripScroll(event.currentTarget.scrollLeft)}
        onWheel={(event) => {
          const el = stripRef.current;
          if (!el || event.deltaY === 0) return;
          event.stopPropagation();
          el.scrollLeft += event.deltaY > 0 ? 40 : -40;
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          className="relative h-full"
          style={{
            width: totalW,
            transform: `translateY(${-geo.top * scale}px)`,
          }}
        >
          {geo.slots.map((widget, index) => (
            <Fragment key={`${widget.id}:${index}`}>
              <span
                aria-hidden
                className="absolute bg-mc-edge"
                style={{
                  left: widget.x * scale,
                  top: widget.y * scale,
                  width: widget.w * scale,
                  height: widget.h * scale,
                }}
              />
              <SlotHitbox
                widget={widget}
                dataset={dataset}
                lang={lang}
                langMap={langMap}
                nav={nav}
                scale={scale}
                margin={0}
                interactive={interactive}
                tooltipLevel={tooltipLevel}
              />
              {widget.count !== undefined && widget.count > 1 ? (
                <span
                  aria-hidden
                  className="font-mc pointer-events-none absolute leading-none text-white"
                  style={{
                    left: widget.x * scale,
                    top: (widget.y + widget.h - 8) * scale,
                    width: widget.w * scale,
                    paddingRight: scale,
                    fontSize: 7 * scale,
                    textAlign: 'right',
                    textShadow: `${scale}px ${scale}px 0 var(--color-mc-arrow)`,
                  }}
                >
                  {formatCount(widget.count)}
                </span>
              ) : null}
            </Fragment>
          ))}
          {texts.map((widget, index) => (
            <CardText
              key={`${widget.x}:${widget.y}:${index}`}
              widget={widget}
              scale={scale}
              langMap={langMap}
            />
          ))}
        </div>
      </div>
      <div
        className="absolute"
        style={{
          left: (margin + 3) * scale,
          top: geo.barTop * scale,
          width: (contentGuiW - 8) * scale,
          height: 4 * scale,
          background: 'var(--color-mc-inset)',
          borderTop: '1px solid var(--color-mc-bevel-dark)',
          borderBottom: '1px solid var(--color-mc-bevel-light)',
        }}
        onPointerDown={(event) => {
          const el = stripRef.current;
          if (!el || event.button !== 0) return;
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          const thumbRange = Math.max(trackW - thumbW, 1);
          const trackX =
            event.clientX - event.currentTarget.getBoundingClientRect().left;
          el.scrollLeft =
            ((trackX - thumbW / 2) / thumbRange) * maxScroll;
        }}
      >
        <div
          className="absolute cursor-ew-resize"
          style={{
            left: thumbX,
            top: 0,
            bottom: 0,
            width: thumbW,
            background: 'var(--color-mc-paper)',
            boxShadow: `inset 0 ${scale}px 0 var(--color-mc-shadow), inset 0 -${scale}px 0 var(--color-mc-bevel-dark)`,
            touchAction: 'none',
          }}
          onPointerDown={(event) => {
            const el = stripRef.current;
            if (!el || event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);
            barDrag.current = { x: event.clientX, left: el.scrollLeft };
          }}
          onPointerMove={(event) => {
            const drag = barDrag.current;
            const el = stripRef.current;
            if (!drag || !el) return;
            const thumbRange = Math.max(trackW - thumbW, 1);
            el.scrollLeft =
              drag.left +
              ((event.clientX - drag.x) / thumbRange) * maxScroll;
          }}
          onPointerUp={() => (barDrag.current = null)}
          onPointerCancel={() => (barDrag.current = null)}
        />
      </div>
    </>
  );
}

