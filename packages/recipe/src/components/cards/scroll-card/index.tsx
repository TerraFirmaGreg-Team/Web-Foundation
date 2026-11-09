'use client';

import { useMemo, useRef, useState, type ComponentProps } from 'react';
import { recipeGlareFilter } from '@terrafirmagreg-team/recipe/components/cards/glare-filter';
import { StripCardMember } from '@terrafirmagreg-team/recipe/components/cards/strip-card/member-cell';
import { StripCardTagPager } from '@terrafirmagreg-team/recipe/components/cards/strip-card/buttons';
import { recipeScroll } from '@terrafirmagreg-team/recipe/lib/data/scroll';
import { useInView } from '@terrafirmagreg-team/ui/hooks/use-in-view';
import { useSwipe } from '@terrafirmagreg-team/ui/hooks/use-swipe';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { RecipeCard } from '@terrafirmagreg-team/recipe/components/cards/card';

const FALLBACK_PITCH = 18;

type Props = ComponentProps<typeof RecipeCard>;

export function ScrollCard(props: Props) {
  const {
    recipe,
    dataset,
    lang,
    langMap,
    nav,
    title,
    src,
    onFail,
    naturalW,
    naturalH,
    interactive = true,
    slotTooltip,
    eager,
    frameOnly,
  } = props;
  const scale = recipe.scale ?? 2;
  const margin = recipe.margin ?? 0;
  const scroll = recipeScroll(recipe.properties);
  const rootRef = useRef<HTMLDivElement>(null);
  const observedInView = useInView(rootRef);
  const inView = eager || observedInView;
  const [page, setPage] = useState(0);

  const members = useMemo(() => {
    if (!scroll) return [];
    const horizontal = scroll.axis === 'horizontal';
    const paneStart = horizontal ? scroll.y : scroll.x;
    const paneEnd = paneStart + (horizontal ? scroll.h : scroll.w);
    return Object.values(recipe.slots ?? {}).filter((slot) => {
      if (slot.x === undefined || slot.y === undefined) return false;
      const mid = horizontal ? slot.y + 9 : slot.x + 9;
      return mid >= paneStart && mid < paneEnd;
    });
  }, [recipe.slots, scroll]);

  const pitch = useMemo(() => {
    if (!scroll) return FALLBACK_PITCH;
    const horizontal = scroll.axis === 'horizontal';
    const coords = Array.from(
      new Set(members.map((slot) => (horizontal ? slot.x : slot.y) ?? 0)),
    ).sort((a, b) => a - b);
    let min = 0;
    for (let i = 1; i < coords.length; i++) {
      const delta = coords[i] - coords[i - 1];
      if (delta > 0 && (min === 0 || delta < min)) min = delta;
    }
    return min || FALLBACK_PITCH;
  }, [members, scroll]);

  const horizontal = scroll?.axis === 'horizontal';
  const paneSpan = scroll ? (horizontal ? scroll.w : scroll.h) : 0;
  const perPage = Math.max(1, Math.floor(paneSpan / pitch));
  const contentSpan = useMemo(() => {
    if (!scroll) return 0;
    let extent = horizontal ? scroll.x : scroll.y;
    for (const slot of members) {
      extent = Math.max(
        extent,
        (horizontal ? slot.x : slot.y)! + FALLBACK_PITCH,
      );
    }
    return extent - (horizontal ? scroll.x : scroll.y);
  }, [members, scroll, horizontal]);
  const pages = Math.max(1, Math.ceil(contentSpan / (perPage * pitch)));
  const clamped = Math.min(page, pages - 1);
  const offset = clamped * perPage * pitch * scale;
  const swipe = useSwipe((dir) =>
    setPage((p) => Math.max(0, Math.min(pages - 1, p + dir))),
  );

  if (!scroll) return null;
  const pane = {
    left: (scroll.x + margin) * scale,
    top: (scroll.y + margin) * scale,
    width: scroll.w * scale,
    height: scroll.h * scale,
  };
  const memberOf = (slot: (typeof members)[number]) => ({
    id: slot.ref?.id ?? slot.id,
    kind: slot.ref?.kind ?? slot.kind,
    amount: slot.count ?? slot.amount,
    chance: slot.chance,
  });

  return (
    <div
      ref={rootRef}
      className={cn('relative w-fit overflow-hidden rounded-sm bg-mc-panel')}
      {...swipe}
      onWheel={(event) => {
        if (event.deltaY === 0) return;
        const next = clamped + (event.deltaY > 0 ? 1 : -1);
        if (next < 0 || next >= pages) return;
        event.stopPropagation();
        setPage(next);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dump asset */}
      <img
        src={src}
        alt={title}
        className="block"
        width={naturalW}
        height={naturalH}
        loading="lazy"
        decoding="async"
        onError={onFail}
        style={recipeGlareFilter}
      />
      <div
        className="absolute overflow-hidden"
        style={{ left: pane.left, top: pane.top, width: pane.width, height: pane.height }}
      >
        {inView && !frameOnly
          ? members.map((slot, index) => {
              const x = (slot.x! - scroll.x) * scale;
              const y = (slot.y! - scroll.y) * scale;
              const member = memberOf(slot);
              if (!member.id) return null;
              const shifted = horizontal ? x - offset : y - offset;
              if (shifted < -pitch * scale || shifted > paneSpan * scale)
                return null;
              return (
                <span
                  key={`${member.id}:${index}`}
                  className="absolute"
                  style={{
                    left: horizontal ? shifted : x,
                    top: horizontal ? y : shifted,
                    width: pitch * scale,
                    height: pitch * scale,
                  }}
                >
                  <span className="absolute inset-0 rounded-[2px] border border-black/25 bg-black/10" />
                  <span className="absolute inset-0">
                    <StripCardMember
                      member={member}
                      dataset={dataset}
                      lang={lang}
                      langMap={langMap}
                      nav={nav}
                      x={0}
                      y={0}
                      pitch={pitch * scale}
                      interactive={interactive}
                      tooltipLevel={slotTooltip}
                    />
                  </span>
                </span>
              );
            })
          : null}
      </div>
      {pages > 1 && (
        <>
          <StripCardTagPager
            left={(margin + 2) * scale}
            top={margin * scale}
            dir={-1}
            scale={scale}
            disabled={clamped <= 0}
            onClick={() => setPage(clamped - 1)}
          />
          <StripCardTagPager
            left={(margin + ((naturalW ?? 0) / scale - margin - 14)) * scale}
            top={margin * scale}
            dir={1}
            scale={scale}
            disabled={clamped + 1 >= pages}
            onClick={() => setPage(clamped + 1)}
          />
        </>
      )}
    </div>
  );
}
