'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { EntryTooltip } from '@terrafirmagreg-team/game/components/entry/tooltip';
import { fetchEntityTexture } from '@terrafirmagreg-team/game/lib/entry/icon-load';
import { stackDisplayName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import type {
  RecipeSceneEntity,
  RecipeSceneRect,
} from '@terrafirmagreg-team/recipe/lib/data/scene';
import type { RecipeDecorWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';

export function sceneEntityHit(
  entities: RecipeSceneEntity[],
  widget: RecipeDecorWidget,
): boolean {
  return entities.some((entity) => {
    const region: RecipeSceneRect = entity.clip ?? entity;
    return (
      widget.x < region.x + region.w &&
      widget.x + widget.w > region.x &&
      widget.y < region.y + region.h &&
      widget.y + widget.h > region.y
    );
  });
}

export function CardSceneOverlay({
  entity,
  dataset,
  lang,
  langMap,
  scale,
  margin,
  interactive = true,
}: {
  entity: RecipeSceneEntity;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  scale: number;
  margin: number;
  interactive?: boolean;
}) {
  const baked = entity.baked === true;
  const tex = useAsyncResult(
    !baked && dataset
      ? async () => ({
          key: entity.id,
          url: await fetchEntityTexture(dataset, entity.id),
        })
      : false,
    [baked, dataset, entity.id],
  );
  const url =
    tex.value && tex.value.key === entity.id ? tex.value.url : undefined;
  const missing = !baked && !tex.pending && url == null;
  const region = entity.clip ?? entity;
  const body = (
    <span
      className="absolute block"
      style={{
        left: (region.x + margin) * scale,
        top: (region.y + margin) * scale,
        width: (region.w || 16) * scale,
        height: (region.h || 16) * scale,
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 m-auto h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      {missing ? (
        <span
          aria-hidden
          className="font-mc pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground"
          style={{ fontSize: 8 * scale }}
        >
          ?
        </span>
      ) : null}
    </span>
  );
  if (!interactive) return body;
  return (
    <EntryTooltip
      dataset={dataset}
      id={entity.id}
      name={stackDisplayName(langMap, entity.id, 'entity')}
      kind="entity"
      lang={lang}
      langMap={langMap}
    >
      {body}
    </EntryTooltip>
  );
}

