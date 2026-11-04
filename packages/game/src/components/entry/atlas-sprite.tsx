'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { atlasPagePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import type { AtlasLookup } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import { Sprite } from '@terrafirmagreg-team/ui/components/blocks/sprite';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function AtlasSprite({
  dataset,
  lookup,
  size = 16,
  className,
}: {
  dataset: DatasetRef;
  lookup: AtlasLookup | null;
  size?: number;
  className?: string;
}) {
  const url = lookup
    ? atlasPagePublicUrl(dataset, lookup.atlas, lookup.page)
    : undefined;
  return (
    <Sprite
      src={url}
      rect={lookup ? lookup.sprite : undefined}
      page={lookup ? lookup.page : undefined}
      tint={
        lookup?.sprite.tintColor && lookup.sprite.tint !== 'none'
          ? lookup.sprite.tintColor
          : undefined
      }
      size={size}
      className={className}
      fallback={
        <Skeleton
          className={cn('inline-block shrink-0', className)}
          style={{ width: size, height: size }}
        />
      }
    />
  );
}
