'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useState, type CSSProperties } from 'react';
import { useViewport } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import {
  chapterImageClickHref,
  chapterImageLayout,
  chapterImagePaint,
  chapterImageTransformOrigin,
  questTexturePublicUrl,
  withInferredChapterSprite,
} from '@terrafirmagreg-team/quest/lib/image';
import type { ChapterImage } from '@terrafirmagreg-team/quest/lib/data/dto';
import { useChapterSpriteStyle } from '@terrafirmagreg-team/quest/hooks/use-chapter-sprite-style';

function ChapterImageMedia({
  image,
  dataset,
  paint,
  spriteStyle,
  onProbe,
}: {
  image: ChapterImage;
  dataset: DatasetRef;
  paint: ReturnType<typeof chapterImagePaint>;
  spriteStyle: CSSProperties | undefined;
  onProbe?: (width: number, height: number) => void;
}) {
  const url = questTexturePublicUrl(dataset, image.image);
  const [failed, setFailed] = useState(false);

  const fail = () => {
    setFailed(true);
  };

  if (failed || !url) {
    return null;
  }

  if (spriteStyle) {
    return (
      <div
        className="h-full w-full"
        style={{
          ...spriteStyle,
          backgroundImage: `url(${url})`,
          opacity: paint?.mediaOpacity,
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="h-full w-full"
      style={{
        imageRendering: 'pixelated',
        opacity: paint?.mediaOpacity,
        objectFit: 'fill',
      }}
      onLoad={(event) => {
        onProbe?.(
          event.currentTarget.naturalWidth,
          event.currentTarget.naturalHeight,
        );
      }}
      onError={fail}
    />
  );
}

function ChapterImageItem({
  image,
  dataset,
  gridScale,
}: {
  image: ChapterImage;
  dataset: DatasetRef;
  gridScale: number;
}) {
  const [resolved, setResolved] = useState(image);
  const { widthPx, heightPx, x, y } = chapterImageLayout(resolved, gridScale);
  const paint = chapterImagePaint(resolved);
  const spriteStyle = useChapterSpriteStyle(resolved);
  const clickHref = chapterImageClickHref(resolved.click);
  const rotation = resolved.rotation ?? 0;
  const transformOrigin = chapterImageTransformOrigin(resolved.alignToCorner);
  const media = (
    <ChapterImageMedia
      image={resolved}
      dataset={dataset}
      paint={paint}
      spriteStyle={spriteStyle}
      onProbe={(width, height) => {
        setResolved((current) =>
          withInferredChapterSprite(current, width, height),
        );
      }}
    />
  );

  return (
    <div
      className={cn(
        'absolute overflow-hidden',
        clickHref
          ? 'pointer-events-auto cursor-pointer'
          : 'pointer-events-none',
      )}
      style={{
        left: x - widthPx / 2,
        top: y - heightPx / 2,
        width: widthPx,
        height: heightPx,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin,
      }}
    >
      {clickHref ? (
        <a
          href={clickHref}
          target="_blank"
          rel="noreferrer"
          className="block h-full w-full"
        >
          {media}
        </a>
      ) : (
        media
      )}
      {paint?.tintRgb ? (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{ background: paint.tintRgb, opacity: paint.tintOpacity }}
        />
      ) : null}
    </div>
  );
}

export function ChapterImages({
  images,
  dataset,
  gridScale,
}: {
  images: ChapterImage[];
  dataset: DatasetRef;
  gridScale: number;
}) {
  const { x, y, zoom } = useViewport();
  if (!images.length) return null;
  return (
    <div className="quest-chapter-images pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {images.map((image, index) => (
          <ChapterImageItem
            key={`${image.image}:${image.x}:${image.y}:${index}`}
            image={image}
            dataset={dataset}
            gridScale={gridScale}
          />
        ))}
      </div>
    </div>
  );
}

