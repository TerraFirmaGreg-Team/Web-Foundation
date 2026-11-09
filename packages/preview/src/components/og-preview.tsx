'use client';

import type { SectionKey } from '@terrafirmagreg-team/sites';
import { useOgMeta } from '../hooks/og-meta';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';

export type OgPreviewProps = {
  url?: string;
  section?: SectionKey;
  dataset?: string;
  slug?: string;
  lang?: string;
  version?: string;
};

function withVariant(image: string, query: string): string {
  const path = image.replace(/image\.webp$/, '');
  const trimmed = query.replace(/^[~?]+/, '');
  return trimmed
    ? `${path}~${encodeURIComponent(trimmed)}/image.webp`
    : `${path}image.webp`;
}

function Frame({
  src,
  meta,
  loading,
  failed,
}: {
  src?: string;
  meta?: { title?: string; description?: string };
  loading?: boolean;
  failed?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- preview needs plain img
        <img
          key={src}
          src={src}
          alt="OG preview"
          className="block w-full"
          style={{ aspectRatio: '1200/630' }}
        />
      ) : failed ? (
        <p className="p-4 text-sm text-destructive">
          не удалось прочитать og meta со страницы
        </p>
      ) : (
        loading && (
          <Skeleton
            className="w-full rounded-none"
            style={{ aspectRatio: '1200/630' }}
          />
        )
      )}
      <div className="flex items-center gap-3 border-t border-border px-3 py-2">
        {meta?.title && (
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium">{meta.title}</span>
            {meta.description && (
              <span className="text-muted-foreground">
                {' '}
                — {meta.description}
              </span>
            )}
          </p>
        )}
        {!meta?.title && src && (
          <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            {src}
          </code>
        )}
      </div>
    </div>
  );
}

export function useOgImage({
  url,
  section = 'recipe',
  dataset = 'modern',
  slug = '',
  lang,
  version,
}: OgPreviewProps) {
  const raw = url?.trim();
  const { meta, failed } = useOgMeta(raw ? url : undefined);
  const [slugPath, slugQuery = ''] = slug.split('?');
  const baseImage = raw
    ? meta?.image
    : `/api/preview/${section}/${dataset}/${slugPath ? `${slugPath}/` : ''}image.webp`;
  const params = new URLSearchParams(slugQuery);
  if (lang) params.set('lang', lang);
  if (version) params.set('version', version);
  const query = params.toString();
  return {
    src: baseImage ? withVariant(baseImage, query) : undefined,
    meta: raw ? meta : undefined,
    loading: !!raw && !meta && !failed,
    failed: raw ? failed || (!!meta && !meta.image) : !baseImage,
  };
}

export function OgPreview(props: OgPreviewProps) {
  const { src, meta, loading, failed } = useOgImage(props);
  return (
    <div className="flex w-full flex-col gap-4">
      <Frame src={src} meta={meta} loading={loading} failed={failed} />
    </div>
  );
}
