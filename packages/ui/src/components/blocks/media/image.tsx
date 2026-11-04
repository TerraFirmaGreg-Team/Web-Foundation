'use client';

import { useState, type CSSProperties } from 'react';
import { useAsyncEffect, useAsyncResult, useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cropOpaqueImageDataUrl } from '@terrafirmagreg-team/ui/lib/media/crop-opaque';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function MediaImage({
  src,
  alt,
  eager = false,
  className,
  style,
  href,
  missing = 'box',
  crop = false,
  width,
  height,
  align,
  pixelated,
  onError,
}: {
  src?: string | Promise<string | undefined> | null;
  alt?: string;
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
  href?: string | Promise<string | undefined>;
  missing?: 'box' | 'hide';
  crop?: boolean;
  width?: number;
  height?: number;
  align?: 'center' | string;
  pixelated?: boolean;
  onError?: () => void;
}) {
  const t = useTranslations();
  const asyncSrc = src != null && typeof src !== 'string';
  const { value: resolved, pending } = useAsyncResult(
    asyncSrc ? () => src : false,
    [src],
  );
  const url = asyncSrc ? resolved : (src ?? undefined);
  const resolvedHref = useAsyncValue(
    href === undefined
      ? false
      : typeof href === 'string'
        ? () => Promise.resolve(href)
        : () => href,
    [href],
  );
  const sourceKey = url ?? '';
  const [state, setState] = useState<{
    key: string;
    cropped?: string;
    failed?: boolean;
  }>({ key: sourceKey });
  const failed = state.key === sourceKey && state.failed === true;
  const cropped = state.key === sourceKey ? state.cropped : undefined;

  useAsyncEffect(
    url && crop
      ? (isCancelled) => {
          const img = new Image();
          img.onload = () => {
            if (!isCancelled()) {
              setState({
                key: url,
                cropped: cropOpaqueImageDataUrl(img),
              });
            }
          };
          img.onerror = () => {
            if (!isCancelled()) {
              setState({ key: url, failed: true });
              onError?.();
            }
          };
          img.src = url;
        }
      : false,
    [url, crop],
  );

  if (asyncSrc && pending) return null;
  if (!url || failed) {
    if (missing === 'hide') return null;
    return (
      <div
        role="img"
        aria-label={alt || t('Image unavailable', { note: 'ui.image_unavailable' })}
        className={cn(
          'flex min-h-24 w-full items-center justify-center rounded-md border border-border bg-secondary text-sm text-muted-foreground',
          className,
        )}
      >
        {t('Image unavailable', { note: 'ui.image_unavailable' })}
      </div>
    );
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cropped ?? url}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      fetchPriority={eager ? 'high' : 'auto'}
      className={cn(crop ? 'max-w-full object-contain' : undefined, className)}
      style={{
        ...style,
        ...(pixelated ? { imageRendering: 'pixelated' } : null),
      }}
      onError={() => {
        setState({ key: sourceKey, failed: true });
        onError?.();
      }}
    />
  );
  if (!resolvedHref) return img;
  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noreferrer"
      className={align === 'center' ? 'mx-auto block w-fit' : 'contents'}
    >
      {img}
    </a>
  );
}

