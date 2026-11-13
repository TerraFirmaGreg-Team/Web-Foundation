'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import Link from 'next/link';
import { ENTRY_CYCLE_MS, EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import {
  EntryTooltip,
  type EntryTooltipLevel,
} from '@terrafirmagreg-team/game/components/entry/tooltip';
import { useCycleIndex } from '@terrafirmagreg-team/ui/hooks/use-cycle-index';
import {
  formatCount,
  formatFluidAmount,
} from '@terrafirmagreg-team/ui/lib/utils/format';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import { entryHref } from '@terrafirmagreg-team/game/lib/entry/href';
import { loadStackDisplay } from '@terrafirmagreg-team/game/lib/entry/tooltip';
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
  const name =
    widget.kind === 'tag'
      ? `#${widget.id.replace(/^#+/, '')}`
      : stackDisplayName(langMap, widget.id);
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
    ? widget.kind === 'fluid'
      ? 'fluid'
      : widget.tagKind === 'fluid' || widget.tagKind === 'block'
        ? widget.tagKind
        : undefined
    : widgetRefKind(widget);
  const icon = (
    <span className="pointer-events-none flex size-full items-center justify-center">
      {alternatives && alternatives.length > 1 ? (
        <span
          aria-hidden
          className="absolute bg-mc-inset"
          style={{ inset: scale }}
        />
      ) : null}
      <EntryIcon
        id={iconId}
        kind={iconKind}
        dataset={dataset}
        size={iconSize}
        missing="placeholder"
      />
      {widget.kind === 'tag' ? (
        <span
          aria-hidden
          className="font-mc pointer-events-none absolute top-0 left-0 leading-none text-amber-300"
          style={{
            paddingLeft: scale / 2,
            fontSize: (Math.min(widget.w, widget.h) / 16) * 7 * scale,
            textShadow: `${scale}px ${scale}px 0 var(--color-mc-arrow)`,
          }}
        >
          #
        </span>
      ) : null}
    </span>
  );
  const pos = {
    left: (widget.x + margin) * scale,
    top: (widget.y + margin) * scale,
    width: widget.w * scale,
    height: widget.h * scale,
  };
  const badge =
    widget.count !== undefined && widget.count > 1 ? (
      <span
        aria-hidden
        className="font-mc pointer-events-none absolute right-0 bottom-0 leading-none text-white"
        style={{
          paddingRight: scale,
          paddingBottom: scale,
          fontSize:
            (Math.min(widget.w, widget.h) / 16) *
            (widget.kind === 'fluid' ? 4 : 7) *
            scale,
          textShadow: `${scale}px ${scale}px 0 var(--color-mc-arrow)`,
        }}
      >
        {widget.kind === 'fluid'
          ? formatFluidAmount(widget.count)
          : formatCount(widget.count, 1_000)}
      </span>
    ) : null;
  const amountLine =
    widget.kind === 'fluid' && widget.count !== undefined ? (
      <p className="text-muted-foreground">
        {widget.count.toLocaleString('en-US')} mB
      </p>
    ) : undefined;
  if (!interactive) {

    if (tooltipLevel === 'none') {
      return (
        <span
          aria-label={name}
          className="absolute block"
          style={pos}
        >
          {icon}
          {badge}
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
        subheader={amountLine}
      >
        <span
          {...hover}
          aria-label={name}
          className="absolute block"
          style={pos}
        >
          {icon}
          {badge}
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
      subheader={amountLine}
    >
      <span
        {...hover}
        className="absolute block cursor-pointer"
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
            {badge}
          </Link>
        ) : (
          <span className="absolute inset-0 block">
            {icon}
            {badge}
          </span>
        )}
      </span>
    </EntryTooltip>
  );
}

