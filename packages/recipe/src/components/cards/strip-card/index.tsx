'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Fragment, useRef, useState } from 'react';
import { SlotHitbox } from '@terrafirmagreg-team/recipe/components/cards/slot-hitbox';
import { recipeGlareFilter } from '@terrafirmagreg-team/recipe/components/cards/glare-filter';
import { StripCardSprite } from '@terrafirmagreg-team/recipe/components/cards/strip-card/sprite';
import {
  StripCardTagCopy,
  StripCardTagPager,
} from '@terrafirmagreg-team/recipe/components/cards/strip-card/buttons';
import { StripCardMember } from '@terrafirmagreg-team/recipe/components/cards/strip-card/member-cell';
import { recipeGrid } from '@terrafirmagreg-team/recipe/lib/data/grid';
import { recipeSlots } from '@terrafirmagreg-team/recipe/lib/browser/recipe-slots';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useInView } from '@terrafirmagreg-team/ui/hooks/use-in-view';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import type { EntryTooltipLevel } from '@terrafirmagreg-team/game/components/entry/tooltip';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

const SCALE = 2;

export function StripCard({
  recipe,
  dataset,
  lang,
  langMap,
  nav,
  title,
  src,
  onFail,
  naturalW,
  interactive = true,
  slotTooltip,
  eager,
  frameOnly,
}: {
  recipe: Recipe;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  nav?: Pick<RecipeHrefOpts, 'tab' | 'search'>;
  title: string;
  src: string;
  onFail: () => void;
  naturalW?: number;
  naturalH?: number;
  interactive?: boolean;
  slotTooltip?: EntryTooltipLevel;
  eager?: boolean;

  frameOnly?: boolean;
}) {
  const scale = recipe.scale ?? SCALE;
  const margin = recipe.margin ?? 0;
  const info = recipeGrid(recipe.properties);
  const rootRef = useRef<HTMLDivElement>(null);
  const observedInView = useInView(rootRef);
  const inView = eager || observedInView;
  const [page, setPage] = useState(0);
  const [measured, setMeasured] = useState<{ src: string; h: number }>();
  if (!info) return null;
  const { grid, members } = info;
  const pageSize = grid.cols * grid.rows;
  const pages = Math.max(1, Math.ceil(members.length / pageSize));
  const clamped = Math.min(page, pages - 1);
  const shown = members.slice(clamped * pageSize, (clamped + 1) * pageSize);
  const shownRows = Math.max(1, Math.ceil(shown.length / grid.cols));

  const imgW = recipe.w ?? naturalW ?? 0;
  const imgH = measured?.src === src ? measured.h : 0;
  const topH = (grid.y + margin) * scale;
  const rowH = grid.row * scale;
  const bottomH = (grid.tail + margin) * scale;
  const rowSrc = (margin + grid.y) * scale;
  const bottomSrc = Math.max(0, imgH - bottomH);
  const edgeW = margin * scale;
  const guiW = imgW / scale - margin * 2;
  const buttonTop = margin * scale;

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative w-fit overflow-hidden rounded-sm bg-mc-panel',
      )}
      style={{
        width: imgW,
        height: topH + shownRows * rowH + bottomH,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- dump asset */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute h-0 w-0 opacity-0"
        onError={onFail}
        onLoad={(event) =>
          setMeasured({ src, h: event.currentTarget.naturalHeight })
        }
      />
      <div className="absolute inset-0" style={recipeGlareFilter}>
        <Hint label={title}>
          <StripCardSprite
            src={src}
            pos="0 0"
            width={imgW}
            height={topH}
            className="absolute left-0 top-0"
          />
        </Hint>
        {Array.from({ length: shownRows }, (_, rowIndex) => {
          const cells = Math.min(
            grid.cols,
            shown.length - rowIndex * grid.cols,
          );
          return (
            <Fragment key={rowIndex}>
              <StripCardSprite
                src={src}
                pos={`0 -${rowSrc}px`}
                width={edgeW + cells * rowH}
                height={rowH}
                className="absolute left-0"
                style={{ top: topH + rowIndex * rowH }}
              />
              <StripCardSprite
                src={src}
                pos={`${edgeW - imgW}px -${rowSrc}px`}
                width={edgeW}
                height={rowH}
                className="absolute right-0"
                style={{ top: topH + rowIndex * rowH }}
              />
            </Fragment>
          );
        })}
        {imgH > 0 && (
          <StripCardSprite
            src={src}
            pos={`0 -${bottomSrc}px`}
            width={imgW}
            height={bottomH}
            className="absolute bottom-0 left-0"
          />
        )}
      </div>
      {inView && !frameOnly
        ? recipeSlots(recipe).map((widget, index) => (
            <SlotHitbox
              key={`${widget.id}:${index}`}
              widget={widget}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              nav={nav}
              scale={scale}
              margin={margin}
              interactive={interactive}
              tooltipLevel={slotTooltip}
            />
          ))
        : null}
      {inView && !frameOnly
        ? shown.map((member, index) => (
            <StripCardMember
              key={`${member.id}:${index}`}
              member={member}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              nav={nav}
              x={edgeW + (index % grid.cols) * rowH}
              y={topH + Math.floor(index / grid.cols) * rowH}
              pitch={rowH}
              interactive={interactive}
              tooltipLevel={slotTooltip}
            />
          ))
        : null}
      {pages > 1 && (
        <>
          <StripCardTagPager
            left={(margin + 2) * scale}
            top={buttonTop}
            dir={-1}
            scale={scale}
            disabled={clamped <= 0}
            onClick={() => setPage(clamped - 1)}
            dataset={dataset}
          />
          <StripCardTagPager
            left={(margin + guiW - 14) * scale}
            top={buttonTop}
            dir={1}
            scale={scale}
            disabled={clamped + 1 >= pages}
            onClick={() => setPage(clamped + 1)}
            dataset={dataset}
          />
        </>
      )}
      <StripCardTagCopy
        left={(margin + 24) * scale}
        top={margin * scale}
        scale={scale}
        value={recipe.id}
      />
    </div>
  );
}

