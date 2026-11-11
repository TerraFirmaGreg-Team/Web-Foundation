'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import Link from 'next/link';
import { ENTRY_CYCLE_MS, EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import {
  EntryTooltip,
  type EntryTooltipLevel,
} from '@terrafirmagreg-team/game/components/entry/tooltip';
import { useCycleIndex } from '@terrafirmagreg-team/ui/hooks/use-cycle-index';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import { entryHref } from '@terrafirmagreg-team/game/lib/entry/href';
import { loadStackDisplay } from '@terrafirmagreg-team/game/lib/entry/tooltip';
import { texturePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { favoriteHover } from '@terrafirmagreg-team/recipe/lib/browser/favorite-hover';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { RecipeSlotWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

const SCALE = 2;

const TAG_REF_KIND: Record<string, ReferenceKind> = {
  block: 'blockTag',
  fluid: 'fluidTag',
  entity: 'entityTag',
};

function widgetRefKind(widget: RecipeSlotWidget): ReferenceKind {
  if (widget.kind === 'tag') {
    return TAG_REF_KIND[widget.tagKind ?? 'item'] ?? 'itemTag';
  }
  return widget.kind === 'fluid' ? 'fluid' : 'item';
}

function stackFavoriteProps(widget: RecipeSlotWidget) {
  const refKind = widgetRefKind(widget);
  const stackable =
    (refKind === 'item' || refKind === 'fluid') &&
    !widget.id.startsWith('#');
  return {
    onMouseEnter: () => {
      favoriteHover.slot = stackable
        ? {
            kind: 'stack',
            id: widget.id,
            ...(refKind === 'fluid' ? { ref: 'fluid' as const } : {}),
          }
        : undefined;
    },
    onMouseLeave: () => {
      favoriteHover.slot = undefined;
    },
  };
}

export function SlotHitbox({
  widget,
  dataset,
  lang,
  langMap,
  nav,
  scale = SCALE,
  margin = 0,
  interactive = true,
  tooltipLevel,
}: {
  widget: RecipeSlotWidget;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  nav?: Pick<RecipeHrefOpts, 'tab' | 'search'>;
  scale?: number;
  margin?: number;
  interactive?: boolean;

  tooltipLevel?: EntryTooltipLevel;
}) {
  const name = stackDisplayName(langMap, widget.id);
  const kind =
    widget.kind === 'fluid' || widget.kind === 'tag' ? widget.kind : 'item';
  const checkKind = kind === 'tag' || !interactive ? undefined : kind;
  const stackPeek =
    dataset && checkKind && widget.id
      ? loadStackDisplay.peek(dataset, widget.id, checkKind)
      : undefined;
  const stackRes = useAsyncResult(
    dataset && checkKind && widget.id && stackPeek === undefined
      ? async () => ({
          key: widget.id,
          display: await loadStackDisplay(dataset, widget.id, checkKind),
        })
      : false,
    [dataset, widget.id, checkKind, stackPeek],
  );
  const missingItem =
    checkKind !== undefined &&
    stackPeek === undefined &&
    !stackRes.pending &&
    stackRes.value?.key === widget.id &&
    stackRes.value.display === undefined;
  const iconSize = Math.max(8, Math.min(widget.w - 2, 16) * scale);
  const hover = stackFavoriteProps(widget);
  const alternatives = widget.alternatives;
  const [altIndex] = useCycleIndex(alternatives?.length ?? 0, {
    enabled: interactive !== false && (alternatives?.length ?? 0) > 1,
    intervalMs: ENTRY_CYCLE_MS,
  });
  const iconId =
    alternatives && alternatives.length > 0
      ? (alternatives[altIndex] ?? alternatives[0]!)
      : widget.id;
  const iconKind = alternatives?.length
    ? widget.tagKind === 'fluid' || widget.tagKind === 'block'
      ? widget.tagKind
      : undefined
    : widgetRefKind(widget);
  const chanceUrl =
    dataset && (alternatives?.length ?? 0) > 1
      ? texturePublicUrl(dataset, 'emi:textures/gui/widgets.png')
      : undefined;
  const chance = widget.w >= 26 ? { u: 19, v: 27 } : { u: 1, v: 19 };
  const icon = (
    <span className="pointer-events-none flex size-full items-center justify-center">
      {alternatives && alternatives.length > 1 ? (
        <span
          aria-hidden
          className="absolute bg-mc-inset"
          style={{ inset: scale }}
        >
          {chanceUrl ? (
            <span
              className="absolute inset-0 block"
              style={{
                backgroundImage: `url(${chanceUrl})`,
                backgroundSize: `${256 * scale}px ${256 * scale}px`,
                backgroundPosition: `-${chance.u * scale}px -${chance.v * scale}px`,
                imageRendering: 'pixelated',
              }}
            />
          ) : null}
        </span>
      ) : null}
      <EntryIcon
        id={iconId}
        kind={iconKind}
        dataset={dataset}
        size={iconSize}
        missing="placeholder"
      />
    </span>
  );
  const pos = {
    left: (widget.x + margin) * scale,
    top: (widget.y + margin) * scale,
    width: widget.w * scale,
    height: widget.h * scale,
  };
  if (!interactive) {

    if (tooltipLevel === 'none') {
      return (
        <span
          aria-label={name}
          className="absolute block"
          style={pos}
        >
          {icon}
        </span>
      );
    }
    return (
      <EntryTooltip
        dataset={dataset}
        id={widget.id}
        name={name}
        kind={widgetRefKind(widget)}
        lang={lang}
        langMap={langMap}
        level={tooltipLevel}
      >
        <span
          {...hover}
          aria-label={name}
          className="absolute block"
          style={pos}
        >
          {icon}
        </span>
      </EntryTooltip>
    );
  }
  return (
    <EntryTooltip
      dataset={dataset}
      id={widget.id}
      name={name}
      kind={widgetRefKind(widget)}
      lang={lang}
      langMap={langMap}
      level={tooltipLevel}
    >
      <span
        {...hover}
        className="absolute block"
        style={pos}
        aria-label={name}
      >
        {!missingItem ? (
          <Link
            href={entryHref(
              dataset,
              lang,
              {
                kind: widgetRefKind(widget),
                id: widget.id.startsWith('#') ? widget.id.slice(1) : widget.id,
              },
              nav,
            )}
            className="absolute inset-0 block"
          >
            {icon}
          </Link>
        ) : (
          <span className="absolute inset-0 block">{icon}</span>
        )}
      </span>
    </EntryTooltip>
  );
}

