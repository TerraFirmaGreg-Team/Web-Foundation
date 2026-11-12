'use client';

import { useMemo, useRef } from 'react';
import { SlotHitbox } from '@terrafirmagreg-team/recipe/components/cards/slot-hitbox';
import { recipeGlareFilter } from '@terrafirmagreg-team/recipe/components/cards/glare-filter';
import {
  cardStripGeo,
  countCoveredText,
  slotCoveredLabel,
  slotOverlay,
  textInStrip,
} from '@terrafirmagreg-team/recipe/lib/cards/model';
import { CardText } from '@terrafirmagreg-team/recipe/components/cards/card/text';
import { CardSceneOverlay } from '@terrafirmagreg-team/recipe/components/cards/card/scene';
import { CardWidgetTips } from '@terrafirmagreg-team/recipe/components/cards/card/tips';
import { CardStrip } from '@terrafirmagreg-team/recipe/components/cards/card/strip';
import { recipeSlots } from '@terrafirmagreg-team/recipe/lib/browser/recipe-slots';
import {
  recipeMultiblock,
  recipeSceneEntities,
} from '@terrafirmagreg-team/recipe/lib/data/scene';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { useDumpLocation } from '@terrafirmagreg-team/game/hooks/use-dump-location';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { useInView } from '@terrafirmagreg-team/ui/hooks/use-in-view';
import { GlbEmbedViewer } from '@terrafirmagreg-team/ui/components/blocks/media/glb/viewer';
import type { EntryTooltipLevel } from '@terrafirmagreg-team/game/components/entry/tooltip';
import type {
  Recipe,
  RecipeTextWidget,
} from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

const SCALE = 2;

export function RecipeCard({
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
  interactive,
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
  useDumpLocation(dataset);
  const margin = recipe.margin ?? 0;
  const cardW = naturalW ?? recipe.w ?? 0;
  const cardH = naturalH ?? recipe.h ?? 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const observedInView = useInView(rootRef);
  const inView = eager || observedInView;
  const slots = useMemo(() => recipeSlots(recipe), [recipe]);
  const contentGuiW = cardW / scale - margin * 2;
  const innerBottomGui = cardH / scale - margin;
  const strip = cardStripGeo(slots, contentGuiW, innerBottomGui, margin);
  const plainSlots = strip.overflow
    ? slots.filter((slot) => slot.role !== 'renderOnly')
    : slots;
  const entities = recipeSceneEntities(recipe.properties);
  const textWidgets = recipe.widgets.filter(
    (widget): widget is RecipeTextWidget => widget.type === 'text',
  );
  const stripTexts = textWidgets.filter(
    (widget) => textInStrip(widget, strip) && !countCoveredText(widget, strip.slots),
  );
  const multiblock = recipeMultiblock(recipe.properties);
  const partsTop = multiblock?.parts.length
    ? Math.min(...multiblock.parts.map((part) => part.y)) * scale
    : undefined;
  const sceneHeight = Math.max(
    (partsTop ?? cardH - margin * scale) - margin * scale,
    0,
  );
  const glbUrl = multiblock?.glb
    ? dumpRelPublicUrl(dataset, multiblock.glb)
    : undefined;

  return (
    <div
      ref={rootRef}
      className="relative w-fit overflow-hidden rounded-sm bg-mc-panel"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        className="block"
        width={naturalW}
        height={naturalH}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={onFail}
        style={recipeGlareFilter}
      />
      {inView && interactive && glbUrl ? (
        <div
          className="absolute"
          style={{
            left: margin * scale,
            top: margin * scale,
            width: cardW - margin * 2 * scale,
            height: sceneHeight,
          }}
        >
          <GlbEmbedViewer bare src={glbUrl} title={title} />
        </div>
      ) : null}
      {inView && !frameOnly
        ? entities.map((entity, index) => (
            <CardSceneOverlay
              key={`${entity.id}:${index}`}
              entity={entity}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              scale={scale}
              margin={margin}
              interactive={interactive}
            />
          ))
        : null}
      {inView && !frameOnly
        ? plainSlots.map((widget, index) => (
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
      {inView && interactive ? (
        <CardWidgetTips
          widgets={recipe.widgets}
          entities={entities}
          margin={margin}
          scale={scale}
        />
      ) : null}
      {inView && strip.overflow && !frameOnly ? (
        <CardStrip
          geo={strip}
          texts={stripTexts}
          margin={margin}
          scale={scale}
          contentGuiW={contentGuiW}
          dataset={dataset}
          lang={lang}
          langMap={langMap}
          nav={nav}
          interactive={interactive}
          tooltipLevel={slotTooltip}
        />
      ) : null}
      {inView
        ? textWidgets.map((widget, index) => {
            if (textInStrip(widget, strip) || countCoveredText(widget, slots)) {
              return null;
            }
            const labelSlot = slotCoveredLabel(widget, slots);
            const overlaySlot = labelSlot ?? slotOverlay(widget, slots);
            const micro =
              overlaySlot && widget.h <= 6
                ? (Math.min(overlaySlot.w, overlaySlot.h) / 16) * 4 * scale
                : undefined;
            return (
              <CardText
                key={`${widget.x}:${widget.y}:${index}`}
                widget={widget}
                offX={margin}
                offY={margin}
                scale={scale}
                langMap={langMap}
                size={micro}
                {...(labelSlot
                  ? {
                      anchor: {
                        x: labelSlot.x,
                        y: labelSlot.y,
                        w: labelSlot.w,
                      },
                    }
                  : {})}
              />
            );
          })
        : null}
    </div>
  );
}

