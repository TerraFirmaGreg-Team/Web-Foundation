'use client';

import { useMemo, useRef, useState, type ComponentProps } from 'react';
import { RecipeCard } from './card';
import { SlotHitbox } from './slot-hitbox';
import { StripCard } from './strip-card';
import { recipeGlareFilter } from './glare-filter';
import { recipeGrid } from '@terrafirmagreg-team/recipe/lib/data/grid';
import { recipeSlots } from '@terrafirmagreg-team/recipe/lib/browser/recipe-slots';
import { PagerArrow } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import { useInView } from '@terrafirmagreg-team/ui/hooks/use-in-view';
import { useSwipe } from '@terrafirmagreg-team/ui/hooks/use-swipe';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

const FALLBACK_PITCH = 18;

type RecipeCardProps = ComponentProps<typeof RecipeCard>;

export function PagedCard({
  maxH,
  ...props
}: RecipeCardProps & { maxH?: number }) {
  const { recipe, naturalH, naturalW, src, title, onFail } = props;
  const scale = recipe.scale ?? 2;
  const margin = recipe.margin ?? 0;
  const natural = naturalH ?? 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const observedInView = useInView(rootRef);
  const inView = props.eager || observedInView;
  const [page, setPage] = useState(0);

  const slots = useMemo(() => recipeSlots(recipe), [recipe]);
  const visibleH = maxH ? Math.floor(maxH) : 0;
  const overflow = visibleH > 0 && natural > visibleH;

  const pinTop = useMemo(() => {
    if (!overflow) return 0;
    const tops = slots
      .filter((slot) => slot.role === 'output')
      .map((slot) => ((slot.y ?? 0) + margin) * scale);
    const min = tops.length ? Math.min(...tops) : 0;
    return min > 0 && min < visibleH ? min : 0;
  }, [slots, scale, margin, overflow, visibleH]);

  const rows = useMemo(
    () =>
      [
        ...new Set(
          slots
            .map((slot) => ((slot.y ?? 0) + margin) * scale)
            .filter((y) => y >= pinTop),
        ),
      ].sort((a, b) => a - b),
    [slots, scale, margin, pinTop],
  );

  const pitchPx = useMemo(() => {
    let min = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const delta = rows[i] - rows[i - 1];
      if (delta > 0 && (min === 0 || delta < min)) min = delta;
    }
    return min || FALLBACK_PITCH * scale;
  }, [rows, scale]);

  const capH = Math.max(margin, 1) * scale;
  const memberH = overflow
    ? Math.max(
        pitchPx,
        Math.floor((visibleH - pinTop - capH) / pitchPx) * pitchPx,
      )
    : 0;

  const starts = useMemo(() => {
    if (!overflow) return [0];
    const maxStart = Math.max(pinTop, natural - memberH - capH);
    const stride = Math.max(pitchPx, Math.floor(memberH / pitchPx) * pitchPx);
    const out = [pinTop];
    let start = pinTop;
    while (start < maxStart) {
      const row = rows.find((y) => y > start && y + pitchPx > start + memberH);
      const next = Math.min(row ?? start + stride, maxStart);
      if (next <= start) break;
      out.push(next);
      start = next;
    }
    return out;
  }, [overflow, natural, memberH, capH, pinTop, rows, pitchPx]);

  const pages = starts.length;
  const clamped = Math.min(page, pages - 1);
  const swipe = useSwipe((dir) =>
    setPage((p) => Math.max(0, Math.min(pages - 1, p + dir))),
  );

  if (recipeGrid(recipe.properties)) {
    return <StripCard {...props} />;
  }
  if (!overflow) return <RecipeCard {...props} />;

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative w-fit overflow-hidden rounded-sm bg-mc-panel',
      )}
      style={{ height: pinTop + memberH + capH }}
      {...swipe}
      onWheel={(event) => {
        if (event.deltaY === 0) return;
        const next = clamped + (event.deltaY > 0 ? 1 : -1);
        if (next < 0 || next >= pages) return;
        event.stopPropagation();
        setPage(next);
      }}
    >
      {pinTop > 0 && (
        <div
          className="relative w-fit overflow-hidden"
          style={{ height: pinTop }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dump asset */}
          <img
            src={src}
            alt={title}
            className="block"
            width={naturalW}
            height={natural}
            loading="lazy"
            decoding="async"
            onError={onFail}
            style={recipeGlareFilter}
          />
          {inView && !props.frameOnly
            ? slots
                .filter(
                  (widget) => ((widget.y ?? 0) + margin) * scale < pinTop,
                )
                .map((widget, index) => (
                  <SlotHitbox
                    key={`${widget.id}:${index}`}
                    widget={widget}
                    dataset={props.dataset}
                    lang={props.lang}
                    langMap={props.langMap}
                    nav={props.nav}
                    scale={scale}
                    margin={margin}
                    interactive={props.interactive}
                    tooltipLevel={props.slotTooltip}
                  />
                ))
            : null}
        </div>
      )}
      <div className="overflow-hidden" style={{ height: memberH }}>
        <div style={{ transform: `translateY(${-starts[clamped]}px)` }}>
          <RecipeCard {...props} />
        </div>
      </div>
      <div className="overflow-hidden" style={{ height: capH }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- dump asset */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="block"
          width={naturalW}
          height={natural}
          style={{
            transform: `translateY(${-(natural - capH)}px)`,
            ...recipeGlareFilter,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
      {pages > 1 && (
        <div
          className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-lg bg-background/80 px-0.5 py-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <PagerArrow
            dir={-1}
            variant="ghost"
            size="icon-xs"
            disabled={clamped <= 0}
            onClick={() =>
              setPage((p) => Math.max(0, Math.min(p, pages - 1) - 1))
            }
          />
          <span
            className={cn(
              'px-0.5 text-2xs tabular-nums text-muted-foreground',
            )}
          >
            {clamped + 1}/{pages}
          </span>
          <PagerArrow
            dir={1}
            variant="ghost"
            size="icon-xs"
            disabled={clamped + 1 >= pages}
            onClick={() =>
              setPage((p) => Math.min(pages - 1, Math.min(p, pages - 1) + 1))
            }
          />
        </div>
      )}
    </div>
  );
}

