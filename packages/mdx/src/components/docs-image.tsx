import { ImageZoom } from '@terrafirmagreg-team/ui/components/mdx/image-zoom';
import { resolveSrc } from '../lib/pack-assets';
import type { DocsImageProps } from '../types/mdx';

export function DocsImage({
  src,
  pack,
  mod,
  path,
  alt = '',
  width,
  height,
  className,
  caption,
  defaultPack: pagePack,
  ...rest
}: DocsImageProps) {
  const packHint = pack ?? pagePack;
  const resolved = resolveSrc({ src, pack, mod, path }, packHint);
  if (!resolved) {
    return (
      <p className="not-prose text-sm text-muted-foreground">
        Missing image source (set <code>src</code> or <code>mod</code>+
        <code>path</code>; pack defaults from the docs slug).
      </p>
    );
  }

  const w = Number(width) || undefined;
  const h = Number(height) || undefined;

  return (
    <figure className="not-prose my-4 space-y-2">
      <ImageZoom
        src={resolved}
        alt={alt}
        width={w ?? 960}
        height={h ?? 540}
        className={className}
        {...rest}
      >
        {w === undefined || h === undefined ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved}
            alt={alt}
            width={w}
            height={h}
            className={className}
            style={{ width: w ?? 'auto', height: h ?? 'auto' }}
          />
        ) : undefined}
      </ImageZoom>
      {caption ? (
        <figcaption className="text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

