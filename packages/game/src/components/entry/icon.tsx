'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useState } from 'react';
import { useEntryContext } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import {
  Sprite,
  SpriteFrame,
} from '@terrafirmagreg-team/ui/components/blocks/sprite';
import { AtlasSprite } from '@terrafirmagreg-team/game/components/entry/atlas-sprite';
import { useIconSource } from '@terrafirmagreg-team/game/hooks/use-icon-source';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import type {
  DumpNbt,
  ReferenceKind,
  TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { EntrySize } from '@terrafirmagreg-team/game/types/entry';

export { ENTRY_CYCLE_MS } from '@terrafirmagreg-team/game/hooks/use-icon-source';

const ENTRY_SIZE_PX = { sm: 16, md: 24, lg: 32, xl: 40 } as const;

export function entrySizePx(size: EntrySize): number {
  return typeof size === 'number' ? size : ENTRY_SIZE_PX[size];
}

export function EntryIcon({
  reference,
  id,
  kind,
  tag,
  dataset: datasetProp,
  size: sizeProp = 'md',
  labeled = false,
  label,
  missing = 'placeholder',
  chip = false,
  preferVariant = false,
  entityView,
  members,
  badge,
  badgeClassName,
  children,
}: {

  reference?: TaggedReference;
  id?: string;
  kind?: ReferenceKind;
  tag?: DumpNbt;
  dataset?: DatasetRef;
  size?: EntrySize;
  labeled?: boolean;
  label?: string;
  missing?: 'placeholder' | 'item' | 'hide';
  chip?: boolean;

  preferVariant?: boolean;
  entityView?: 'auto' | 'texture' | 'egg';
  members?: string[];
  badge?: React.ReactNode;
  badgeClassName?: string;
  children?: React.ReactNode;
}) {
  const size = entrySizePx(sizeProp);
  const ctx = useEntryContext();
  const dataset = datasetProp ?? ctx?.dataset;
  const source = useIconSource({
    dataset,
    reference,
    id,
    kind,
    tag,
    missing,
    preferVariant,
    entityView,
    members,
  });
  const caption = label || undefined;
  const name = caption ?? source.rawId;
  const [fileFailed, setFileFailed] = useState<{
    key: string;
    failed: boolean;
  }>({ key: '', failed: false });
  const hideMissing = missing === 'hide';
  const imgSrc = source.imgSrc;

  const failed =
    fileFailed.failed && fileFailed.key === (imgSrc ?? source.sourceKey);

  const boxStyle = { width: size, height: size };
  const pendingBox = (
    <Skeleton
      className="inline-block shrink-0 rounded-sm"
      style={boxStyle}
    />
  );
  const missingBox = (
    <span
      className="font-mc inline-flex shrink-0 items-center justify-center rounded-sm border border-border bg-secondary text-muted-foreground"
      style={{ ...boxStyle, fontSize: Math.max(7, Math.round(size * 0.6)) }}
    >
      ?
    </span>
  );
  const img = (src: string) => (
    <Sprite
      src={src}
      alt={name}
      size={size}
      onError={() =>
        setFileFailed({ key: imgSrc ?? source.sourceKey, failed: true })
      }
    />
  );

  let icon: React.ReactNode = null;
  if (source.cycleRef && dataset) {
    icon = (
      <EntryIcon
        reference={source.cycleRef}
        dataset={dataset}
        size={size}
        missing={missing}
      />
    );
  } else if (source.isEntity && imgSrc && !failed) {
    icon = img(imgSrc);
  } else if (source.isEntity && source.awaitingTexture) {
    icon = hideMissing ? null : pendingBox;
  } else if (source.lookup && dataset) {
    icon = <AtlasSprite dataset={dataset} lookup={source.lookup} size={size} />;
  } else if (source.pending || source.awaitingAtlas) {
    icon = hideMissing ? null : pendingBox;
  } else if (source.awaitingTexture) {
    icon = hideMissing ? null : pendingBox;
  } else if (source.usesAtlas || !imgSrc || failed) {
    icon = hideMissing
      ? null
      : missing === 'item' && source.missingLookup && dataset
        ? (
            <AtlasSprite
              dataset={dataset}
              lookup={source.missingLookup}
              size={size}
            />
          )
        : missing === 'item' && source.missingPending
          ? pendingBox
          : missingBox;
  } else {
    icon = img(imgSrc);
  }

  if (!icon && !labeled && !children) return null;

  const framed = (
    <SpriteFrame
      size={size}
      chip={chip}
      badge={badge}
      badgeClassName={badgeClassName}
    >
      {icon}
    </SpriteFrame>
  );

  if (!labeled && !children) return framed;

  return (
    <span className="inline-flex items-center gap-2 align-middle not-prose">
      {framed}
      {labeled ? (
        caption && caption !== source.rawId ? (
          <span className="text-xs">{caption}</span>
        ) : (
          <code className="text-xs">{source.rawId}</code>
        )
      ) : null}
      {children}
    </span>
  );
}

