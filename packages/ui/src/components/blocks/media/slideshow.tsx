'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Play, Timer } from 'lucide-react';
import {
  ViewerToolbar,
  ViewerControls,
} from '@terrafirmagreg-team/ui/components/blocks/viewer/controls';
import { MediaImage } from '@terrafirmagreg-team/ui/components/blocks/media/image';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useAsyncEffect } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useCycleIndex } from '@terrafirmagreg-team/ui/hooks/use-cycle-index';
import {
  AUTOPLAY_SPEED_MAX,
  AUTOPLAY_SPEED_MIN,
  useAutoplay,
  useAutoplaySpeed,
} from '@terrafirmagreg-team/ui/hooks/viewer/use-viewer-prefs';
import { trimTransparent } from '@terrafirmagreg-team/ui/lib/media/trim-transparent';
import { nearbyIndexes } from '@terrafirmagreg-team/ui/lib/media/nearby-indexes';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function Slideshow({
  images,
  alt,
  border,
  scale,
  offset,
  rotate,
  caption,
}: {
  images: Array<{ id: string; url: string | null }>;
  alt: string;
  border: boolean;
  scale?: number;
  offset?: number;
  rotate?: boolean;
  caption?: ReactNode;
}) {
  const t = useTranslations();
  const [autoplay, setAutoplay] = useAutoplay();
  const [autoplaySpeed, setAutoplaySpeed] = useAutoplaySpeed();
  const [hovered, setHovered] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useCycleIndex(images.length, {
    enabled: autoplay,
    paused: hovered,
    intervalMs: autoplaySpeed * 1000,
  });
  const [trimmed, setTrimmed] = useState<Record<string, string>>({});
  const urls = images.map((entry) => entry.url).join('\0');
  const nearby = nearbyIndexes(selected, images.length);
  const multi = images.length > 1;

  useAsyncEffect((isCancelled) => {
    const list = urls.split('\0');
    for (const index of nearbyIndexes(selected, list.length)) {
      const src = list[index];
      if (!src) continue;
      void trimTransparent(src).then((next) => {
        if (isCancelled()) return;
        setTrimmed((current) =>
          current[src] === next ? current : { ...current, [src]: next },
        );
      });
    }
  }, [selected, urls]);

  const transform = [
    typeof offset === 'number' ? `translateY(${offset}px)` : '',
    rotate ? 'rotate(90deg)' : '',
    `scale(${typeof scale === 'number' ? scale : 1})`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <figure
      className="not-prose my-3 flex flex-col gap-2"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div
        ref={surfaceRef}
        className={cn(
          'relative mx-auto size-96 max-w-full overflow-hidden rounded-xl',
        )}
      >
        {images.length === 0 ? (
          <MediaImage
            src={null}
            alt={alt}
            className="absolute inset-0 h-full w-full"
          />
        ) : null}
        {images.map((entry, index) => {
          if (!nearby.includes(index)) return null;
          const current = index === selected;
          const src = entry.url ? (trimmed[entry.url] ?? entry.url) : null;
          return (
            <span
              key={entry.id}
              aria-hidden={!current || undefined}
              className={cn(
                'absolute inset-0 transition-opacity duration-500 ease-in-out',
                current ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <MediaImage
                src={src}
                alt={current ? alt : ''}
                className={cn(
                  'h-full w-full object-contain',
                  border && 'rounded-md',
                )}
                style={{
                  transform,
                  transformOrigin: 'center',
                }}
                pixelated
              />
            </span>
          );
        })}
        <ViewerToolbar>
          <ViewerControls
            pager={
              multi
                ? {
                    index: selected,
                    count: images.length,
                    onSelect: setSelected,
                  }
                : undefined
            }
            expand={{ target: surfaceRef }}
            settings={{
              label: t('Viewer settings', { note: 'ui.viewer.settings' }),
              sliders: multi
                ? [
                    {
                      icon: <Timer className="size-3.5" />,
                      label: t('Autoplay speed', { note: 'ui.viewer.autoplay_speed' }),
                      min: AUTOPLAY_SPEED_MIN,
                      max: AUTOPLAY_SPEED_MAX,
                      step: 0.5,
                      disabled: !autoplay,
                      format: (value) => `${value.toFixed(1)}s`,
                      value: autoplaySpeed,
                      onChange: setAutoplaySpeed,
                    },
                  ]
                : [],
              toggles: multi
                ? [
                    {
                      icon: <Play className="size-4" />,
                      label: t('Autoplay', { note: 'ui.viewer.autoplay' }),
                      checked: autoplay,
                      onChange: setAutoplay,
                    },
                  ]
                : [],
            }}
          />
        </ViewerToolbar>
      </div>
      {caption ? (
        <figcaption className="mx-auto max-w-prose text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

