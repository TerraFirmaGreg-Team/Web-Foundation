'use client';
import { useEffect, useState } from 'react';
import { uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

const previewCache = createAsyncCache(
  async (key: string): Promise<PagePreviewData | undefined> => {
    const [href, lang] = key.split(' ');
    return uiConfig().loadPagePreview?.(href ?? '', { lang: lang || undefined });
  },
);

export function loadPagePreview(
  href: string,
  lang?: string,
): Promise<PagePreviewData | undefined> {
  return previewCache(`${href} ${lang ?? ''}`);
}

export function usePagePreview(
  href: string,
  active: boolean,
  lang?: string,
): PagePreviewData | null | undefined {
  const [preview, setPreview] = useState<PagePreviewData | null | undefined>(
    null,
  );
  useEffect(() => {
    if (!active) return;
    let mounted = true;
    void loadPagePreview(href, lang).then((data) => {
      if (mounted) setPreview(data);
    });
    return () => {
      mounted = false;
    };
  }, [href, active, lang]);
  return preview;
}

