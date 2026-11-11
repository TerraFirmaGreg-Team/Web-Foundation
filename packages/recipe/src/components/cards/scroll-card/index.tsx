'use client';

import { useId, useMemo, useRef, useState, type ComponentProps } from 'react';
import { RecipeCard } from '@terrafirmagreg-team/recipe/components/cards/card';
import { StripCardMember } from '@terrafirmagreg-team/recipe/components/cards/strip-card/member-cell';
import { CardScrollbar } from '@terrafirmagreg-team/recipe/components/cards/controls/card-scrollbar';
import {
  recipeScroll,
  type ScrollElement,
  type ScrollFrame,
} from '@terrafirmagreg-team/recipe/lib/data/scroll';
import { texturePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { useInView } from '@terrafirmagreg-team/ui/hooks/use-in-view';
import { useSwipe } from '@terrafirmagreg-team/ui/hooks/use-swipe';
import { McText } from '@terrafirmagreg-team/game/components/entry/mc-text';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

const FALLBACK_PITCH = 18;
const BAR_SPAN = 4;
const ATLAS = 256;

type Props = ComponentProps<typeof RecipeCard>;

function Stretch({
  tex,
  sx,
  sy,
  sw,
  sh,
  x,
  y,
  w,
  h,
}: {
  tex: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  if (w <= 0 || h <= 0 || sw <= 0 || sh <= 0) return null;
  const kx = w / sw;
  const ky = h / sh;
  return (
    <span
      aria-hidden
      className="absolute block"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        backgroundImage: `url(${tex})`,
        backgroundSize: `${ATLAS * kx}px ${ATLAS * ky}px`,
        backgroundPosition: `-${sx * kx}px -${sy * ky}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}

function FramePatch({
  tex,
  frame,
  x,
  y,
  w,
  h,
  scale,
}: {
  tex: string;
  frame: ScrollFrame;
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}) {
  const s = frame.s;
  const t = frame.t;
  const ss = s * scale;
  const u = frame.u;
  const v = frame.v;
  const parts = [
    { sx: u, sy: v, sw: s, sh: s, dx: 0, dy: 0, dw: ss, dh: ss },
    { sx: u + s, sy: v, sw: t, sh: s, dx: ss, dy: 0, dw: w - ss * 2, dh: ss },
    { sx: u + s + t, sy: v, sw: s, sh: s, dx: w - ss, dy: 0, dw: ss, dh: ss },
    { sx: u, sy: v + s, sw: s, sh: t, dx: 0, dy: ss, dw: ss, dh: h - ss * 2 },
    {
      sx: u + s,
      sy: v + s,
      sw: t,
      sh: t,
      dx: ss,
      dy: ss,
      dw: w - ss * 2,
      dh: h - ss * 2,
    },
    {
      sx: u + s + t,
      sy: v + s,
      sw: s,
      sh: t,
      dx: w - ss,
      dy: ss,
      dw: ss,
      dh: h - ss * 2,
    },
    { sx: u, sy: v + s + t, sw: s, sh: s, dx: 0, dy: h - ss, dw: ss, dh: ss },
    {
      sx: u + s,
      sy: v + s + t,
      sw: t,
      sh: s,
      dx: ss,
      dy: h - ss,
      dw: w - ss * 2,
      dh: ss,
    },
    {
      sx: u + s + t,
      sy: v + s + t,
      sw: s,
      sh: s,
      dx: w - ss,
      dy: h - ss,
      dw: ss,
      dh: ss,
    },
  ];
  return (
    <span
      aria-hidden
      className="absolute block"
      style={{ left: x, top: y, width: w, height: h }}
    >
      {parts.map((part, i) => (
        <Stretch
          key={i}
          tex={tex}
          sx={part.sx}
          sy={part.sy}
          sw={part.sw}
          sh={part.sh}
          x={part.dx}
          y={part.dy}
          w={part.dw}
          h={part.dh}
        />
      ))}
    </span>
  );
}

export function ScrollCard(props: Props) {
  const { recipe, interactive = true, slotTooltip, eager, frameOnly, dataset } = props;
  const scale = recipe.scale ?? 2;
  const margin = recipe.margin ?? 0;
  const scroll = recipeScroll(recipe.properties);
  const rootRef = useRef<HTMLDivElement>(null);
  const observedInView = useInView(rootRef);
  const inView = eager || observedInView;
  const [offsetRaw, setOffset] = useState(0);

  const horizontal = scroll?.axis === 'horizontal';
  const decomposed =
    scroll?.decomposed === true && (scroll.elements?.length ?? 0) > 0;
  const elements = useMemo(
    () => (decomposed ? (scroll?.elements ?? []) : []),
    [decomposed, scroll],
  );
  const paneId = useId();

  const members = useMemo(() => {
    if (!scroll || decomposed) return [];
    const paneStart = horizontal ? scroll.y : scroll.x;
    const paneEnd = paneStart + (horizontal ? scroll.h : scroll.w);
    return Object.values(recipe.slots ?? {}).filter((slot) => {
      if (slot.x === undefined || slot.y === undefined) return false;
      const mid = horizontal ? slot.y + 9 : slot.x + 9;
      return mid >= paneStart && mid < paneEnd;
    });
  }, [recipe.slots, scroll, horizontal, decomposed]);

  const pitch = useMemo(() => {
    const coords = Array.from(
      new Set(
        (decomposed ? elements : members)
          .map((el) => (horizontal ? el.x : el.y) ?? 0),
      ),
    ).sort((a, b) => a - b);
    let min = 0;
    for (let i = 1; i < coords.length; i++) {
      const delta = coords[i]! - coords[i - 1]!;
      if (delta >= FALLBACK_PITCH / 2 && (min === 0 || delta < min))
        min = delta;
    }
    return min || FALLBACK_PITCH;
  }, [members, elements, decomposed, horizontal]);

  const paneSpan = scroll ? (horizontal ? scroll.w : scroll.h) : 0;
  const contentSpan = useMemo(() => {
    if (!scroll) return 0;
    const start = horizontal ? scroll.x : scroll.y;
    let extent = start + (horizontal ? scroll.contentW : scroll.contentH);
    const cells: ({ x?: number; y?: number; w?: number; h?: number } | ScrollElement)[] = decomposed
      ? elements
      : members;
    for (const cell of cells) {
      const pos = horizontal ? cell.x : cell.y;
      const size = (horizontal ? cell.w : cell.h) ?? FALLBACK_PITCH;
      if (pos !== undefined) extent = Math.max(extent, pos + size);
    }
    return extent - start;
  }, [members, elements, scroll, horizontal, decomposed]);

  const clipStart = scroll?.clipTop ?? 0;
  const maxOffset = Math.max(0, contentSpan - paneSpan);
  const starts = useMemo(() => {
    if (decomposed || members.length === 0) return [0];
    const rows = Array.from(
      new Set(members.map((slot) => (horizontal ? slot.x : slot.y) ?? 0)),
    ).sort((a, b) => a - b);
    const first = rows[0] ?? 0;
    const out = [0];
    let start = 0;
    for (;;) {
      const next = rows.find(
        (r) => r - first > start && r + pitch > first + start + paneSpan,
      );
      if (next === undefined) {
        const last = (rows[rows.length - 1] ?? first) - first;
        if (last > start) out.push(last);
        break;
      }
      const to = next - first;
      if (to <= start) break;
      out.push(to);
      start = to;
    }
    return out;
  }, [members, decomposed, horizontal, paneSpan, pitch]);
  const scrollable = decomposed ? scroll.bar !== undefined : starts.length > 1;
  const offset = useMemo(() => {
    const clamped = Math.min(maxOffset, offsetRaw);
    if (decomposed) return clamped;
    let best = 0;
    for (const s of starts) {
      if (Math.abs(s - clamped) < Math.abs(best - clamped)) best = s;
    }
    return best;
  }, [offsetRaw, starts, decomposed, maxOffset]);

  const swipe = useSwipe(
    (dir) => setOffset(Math.max(0, Math.min(maxOffset, offset + dir * paneSpan))),
    horizontal ? 'x' : 'y',
  );

  if (!scroll) return null;
  const cardW = recipe.w ?? 0;
  const cardH = recipe.h ?? 0;
  const pane = {
    left: (scroll.x + margin) * scale,
    top: (scroll.y + margin) * scale,
    width: Math.max(0, Math.min(scroll.w * scale, cardW - (scroll.x + margin) * scale)),
    height: Math.max(0, Math.min(scroll.h * scale, cardH - (scroll.y + margin) * scale)),
  };
  const barRect = scroll.bar
    ? {
        left: (scroll.bar.x + margin) * scale,
        top: (scroll.bar.y + margin) * scale,
        w: scroll.bar.w * scale,
        h: scroll.bar.h * scale,
      }
    : horizontal
      ? {
          left: pane.left + scale,
          top: pane.top + pane.height - BAR_SPAN * scale,
          w: pane.width - scale * 2,
          h: BAR_SPAN * scale,
        }
      : {
          left: pane.left + pane.width - BAR_SPAN * scale,
          top: pane.top + scale,
          w: BAR_SPAN * scale,
          h: pane.height - scale * 2,
        };

  const viewport = scroll.viewport ?? {
    x: scroll.x,
    y: scroll.y,
    w: scroll.w - (horizontal ? 0 : 9),
    h: scroll.h - (horizontal ? 9 : 0),
  };
  const guiTexUrl = scroll.guiTex ? texturePublicUrl(dataset, scroll.guiTex) : undefined;
  const frameUrl = scroll.frame ? texturePublicUrl(dataset, scroll.frame.tex) : undefined;
  const slotTexUrl = scroll.slotTex ? texturePublicUrl(dataset, scroll.slotTex) : undefined;
  const overlayUrl = scroll.overlay ? dumpRelPublicUrl(dataset, scroll.overlay) : undefined;
  const barSkin =
    guiTexUrl && scroll.barSkin
      ? {
          tex: guiTexUrl,
          atlasW: ATLAS,
          atlasH: ATLAS,
          skin: scroll.barSkin,
          viewSpan: horizontal ? viewport.w : viewport.h,
          contentSpan: horizontal ? scroll.contentW : scroll.contentH,
        }
      : undefined;

  const renderText = (el: ScrollElement, index: number, moving: boolean) => {
    const rgb = (el.color ?? 0xffffff) & 0xffffff;
    const shadowRgb = ((rgb & 0xfcfcfc) >> 2) & 0xffffff;
    const x = (el.x - viewport.x) * scale;
    const y = (el.y - viewport.y) * scale;
    const shifted = (horizontal ? x : y) - (moving ? offset * scale : 0);
    return (
      <span
        key={`t:${index}`}
        className="font-mc absolute leading-none whitespace-pre"
        style={{
          left: horizontal ? shifted : x,
          top: horizontal ? y : shifted,
          fontSize: Math.max(6, (el.h - 1 || 8) * scale),
          color: `#${rgb.toString(16).padStart(6, '0')}`,
          textShadow: `${scale}px ${scale}px 0 #${shadowRgb.toString(16).padStart(6, '0')}`,
        }}
      >
        <McText text={el.text ?? ''} surface="dark" />
      </span>
    );
  };

  const renderSlot = (el: ScrollElement, index: number) => {
    const x = (el.x - viewport.x) * scale;
    const y = (el.y - viewport.y) * scale;
    const shifted = (horizontal ? x : y) - offset * scale;
    const cell = Math.max(el.w, el.h) * scale;
    if (shifted < -cell || shifted > paneSpan * scale) return null;
    const member = el.ref?.id
      ? {
          id: stackIdFromRef(el.ref),
          kind: el.ref.kind,
          amount: 1,
        }
      : null;
    return (
      <span
        key={`s:${index}`}
        className="absolute"
        style={{
          left: horizontal ? shifted : x,
          top: horizontal ? y : shifted,
          width: el.w * scale,
          height: el.h * scale,
        }}
      >
        {slotTexUrl ? (
          <span
            aria-hidden
            className="absolute inset-0 block"
            style={{
              backgroundImage: `url(${slotTexUrl})`,
              backgroundSize: `${ATLAS * scale}px ${ATLAS * scale}px`,
              backgroundPosition: `-${(el.u ?? 0) * scale}px -${(el.v ?? 0) * scale}px`,
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 block"
            style={{
              background: 'var(--color-mc-inset)',
              boxShadow: `inset ${scale}px ${scale}px 0 var(--color-mc-bevel-dark), inset -${scale}px -${scale}px 0 var(--color-mc-bevel-light)`,
            }}
          />
        )}
        {el.mark ? (
          <span
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: scale,
              top: scale,
              right: scale,
              bottom: scale,
              background: 'rgba(0, 0, 0, 0.25)',
            }}
          />
        ) : null}
        {member ? (
          <span className="pointer-events-auto absolute inset-0">
            <StripCardMember
              member={member}
              dataset={dataset}
              lang={props.lang}
              langMap={props.langMap}
              nav={props.nav}
              x={0}
              y={0}
              pitch={el.w * scale}
              tooltipLines={el.tooltip}
              interactive={interactive}
              tooltipLevel={slotTooltip}
            />
          </span>
        ) : null}
        {el.label ? (
          <span
            className="font-mc pointer-events-none absolute right-0 bottom-0 leading-none text-white [text-shadow:1px_1px_0_var(--color-mc-arrow)]"
            style={{ fontSize: (el.w * scale) / 4 }}
          >
            {el.label}
          </span>
        ) : null}
      </span>
    );
  };

  const renderBlock = (el: ScrollElement, index: number, moving: boolean = true) => {
    const x = (el.x - viewport.x) * scale;
    const y = (el.y - viewport.y) * scale;
    const shifted = (horizontal ? x : y) - (moving ? offset * scale : 0);
    const cell = Math.max(el.w, el.h) * scale;
    if (shifted < -cell || shifted > paneSpan * scale) return null;
    const member = el.ref?.id
      ? {
          id: stackIdFromRef(el.ref),
          kind: el.ref.kind,
          amount: 1,
        }
      : null;
    return (
      <span
        key={`b:${index}`}
        className="absolute"
        style={{
          left: horizontal ? shifted : x,
          top: horizontal ? y : shifted,
          width: el.w * scale,
          height: el.h * scale,
        }}
      >
        {member ? (
          <span className="pointer-events-auto absolute inset-0">
            <StripCardMember
              member={member}
              dataset={dataset}
              lang={props.lang}
              langMap={props.langMap}
              nav={props.nav}
              x={0}
              y={0}
              pitch={cell}
              hideIcon
              tooltipLines={el.tooltip}
              interactive={interactive}
              tooltipLevel={slotTooltip}
            />
          </span>
        ) : null}
      </span>
    );
  };

  const overlayImg = (shifted: boolean) =>
    overlayUrl ? (
      // eslint-disable-next-line @next/next/no-img-element -- dump asset
      <img
        src={overlayUrl}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute block max-w-none"
        style={{
          left: horizontal && shifted ? -offset * scale : 0,
          top: !horizontal && shifted ? -offset * scale : 0,
          width: (scroll.overlayW ?? scroll.contentW) * scale,
          height: (scroll.overlayH ?? scroll.contentH) * scale,
          imageRendering: 'pixelated',
        }}
      />
    ) : null;

  return (
    <div
      ref={rootRef}
      className="relative w-fit"
      {...swipe}
      onWheel={(event) => {
        const delta = horizontal ? event.deltaY || event.deltaX : event.deltaY;
        if (delta === 0) return;
        const next = Math.max(0, Math.min(maxOffset, offset + Math.sign(delta) * pitch));
        if (next === offset) return;
        event.stopPropagation();
        setOffset(next);
      }}
    >
      {decomposed ? (
        <div
          role="img"
          aria-label={props.title}
          className="relative w-fit overflow-hidden rounded-sm bg-mc-panel"
          style={{ width: cardW, height: cardH }}
        >
          {frameUrl && scroll.frame ? (
            <FramePatch
              tex={frameUrl}
              frame={scroll.frame}
              x={0}
              y={0}
              w={cardW}
              h={cardH}
              scale={scale}
            />
          ) : null}
          {inView && !frameOnly ? (
            <div
              id={paneId}
              className="pointer-events-none absolute overflow-hidden"
              style={{
                left: pane.left,
                top: pane.top,
                width: pane.width,
                height: pane.height,
              }}
            >
              <div
                className="absolute overflow-hidden"
                style={{
                  left: (viewport.x - scroll.x) * scale,
                  top: (viewport.y - scroll.y) * scale,
                  width: viewport.w * scale,
                  height: viewport.h * scale,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={
                    clipStart > 0
                      ? {
                          clipPath: horizontal
                            ? `inset(0 0 0 ${clipStart * scale}px)`
                            : `inset(${clipStart * scale}px 0 0 0)`,
                        }
                      : undefined
                  }
                >
                  {overlayImg(true)}
                  {elements.map((el, index) =>
                    el.kind === 'slot'
                      ? renderSlot(el, index)
                      : (el.kind === 'block' || el.kind === 'entity') && !el.pin
                        ? renderBlock(el, index)
                        : null,
                  )}
                  {elements.map((el, index) =>
                    el.kind === 'text' && !el.pin
                      ? renderText(el, index, true)
                      : null,
                  )}
                </div>
                {clipStart > 0 ? (
                  <div
                    className="absolute overflow-hidden"
                    style={
                      horizontal
                        ? { left: 0, top: 0, width: clipStart * scale, height: viewport.h * scale }
                        : { left: 0, top: 0, width: viewport.w * scale, height: clipStart * scale }
                    }
                  >
                    {overlayImg(false)}
                  </div>
                ) : null}
              </div>
              {elements.map((el, index) => {
                if (!el.pin) return null;
                if (el.kind === 'text') return renderText(el, index, false);
                if (el.kind === 'entity' || el.kind === 'block')
                  return renderBlock(el, index, false);
                return null;
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <RecipeCard {...props} />
          <div
            id={paneId}
            className="pointer-events-none absolute overflow-hidden"
            style={{
              left: pane.left,
              top: pane.top,
              width: pane.width,
              height: pane.height,
            }}
          >
            {inView && !frameOnly
              ? members.map((slot, index) => {
                  const ref = slot.ref;
                  if (!ref?.id) return null;
                  const member = {
                    id: stackIdFromRef(ref),
                    kind: ref.kind,
                    amount: slot.count ?? slot.amount,
                    chance: slot.chance,
                  };
                  const x = (slot.x! - scroll.x) * scale;
                  const y = (slot.y! - scroll.y) * scale;
                  const cell =
                    Math.max(slot.w ?? 0, slot.h ?? 0, FALLBACK_PITCH) * scale;
                  const shifted = (horizontal ? x : y) - offset * scale;
                  if (shifted < -cell || shifted > paneSpan * scale) return null;
                  return (
                    <span
                      key={`${member.id}:${index}`}
                      className="pointer-events-auto absolute"
                      style={{
                        left: horizontal ? shifted : x,
                        top: horizontal ? y : shifted,
                        width: cell,
                        height: cell,
                      }}
                    >
                      <StripCardMember
                        member={member}
                        dataset={dataset}
                        lang={props.lang}
                        langMap={props.langMap}
                        nav={props.nav}
                        x={0}
                        y={0}
                        pitch={cell}
                        interactive={interactive}
                        tooltipLevel={slotTooltip}
                      />
                    </span>
                  );
                })
              : null}
          </div>
        </>
      )}
      {scrollable && (
        <CardScrollbar
          controlsId={paneId}
          left={barRect.left}
          top={barRect.top}
          w={barRect.w}
          h={barRect.h}
          axis={horizontal ? 'horizontal' : 'vertical'}
          thumbRatio={paneSpan / Math.max(1, contentSpan)}
          position={maxOffset > 0 ? offset / maxOffset : 0}
          scale={scale}
          onScroll={(pos) => setOffset(pos * maxOffset)}
          skin={barSkin}
        />
      )}
    </div>
  );
}
