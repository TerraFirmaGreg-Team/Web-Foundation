'use client';

import { OgPreview, useOgImage, type OgPreviewProps } from './og-preview';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';

export type OgGalleryItem = { label: string } & OgPreviewProps;
export type OgGalleryProps = OgPreviewProps & {
  gallery?: boolean;
  items?: OgGalleryItem[];
  onSelect?: (item: OgGalleryItem) => void;
};

function itemProps({ label: _label, ...props }: OgGalleryItem) {
  return props;
}

function sameProps(a: OgPreviewProps, b: OgPreviewProps) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(
    (k) => a[k as keyof OgPreviewProps] === b[k as keyof OgPreviewProps],
  );
}

function Thumb({
  item,
  active,
  onClick,
}: {
  item: OgGalleryItem;
  active: boolean;
  onClick: () => void;
}) {
  const { src, failed } = useOgImage(item);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-1 text-left ${active ? '' : 'opacity-60 transition-opacity hover:opacity-100'}`}
    >
      <div
        className={`overflow-hidden rounded-md border ${active ? 'border-primary' : 'border-border'}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview needs plain img
          <img
            src={src}
            alt={item.label}
            className="block w-full"
            style={{ aspectRatio: '1200/630' }}
            loading="lazy"
          />
        ) : failed ? (
          <div
            className="flex items-center justify-center text-xs text-destructive"
            style={{ aspectRatio: '1200/630' }}
          >
            —
          </div>
        ) : (
          <Skeleton
            className="w-full rounded-none"
            style={{ aspectRatio: '1200/630' }}
          />
        )}
      </div>
      <span className="truncate text-xs text-muted-foreground">
        {item.label}
      </span>
    </button>
  );
}

export function OgGallery({ items, onSelect, ...props }: OgGalleryProps) {
  const active = items?.findIndex((item) =>
    sameProps(itemProps(item), props),
  );
  if (!items?.length) return <OgPreview {...props} />;
  return (
    <div className="flex w-full flex-col gap-4">
      <OgPreview {...props} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <Thumb
            key={`${item.label}-${i}`}
            item={item}
            active={i === active}
            onClick={() => onSelect?.(item)}
          />
        ))}
      </div>
    </div>
  );
}
