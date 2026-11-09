'use client';

import { useEffect, useState } from 'react';

export type OgMeta = {
  title?: string;
  description?: string;
  image?: string;
};

function isImageUrl(url: URL): boolean {
  const segs = url.pathname.split('/').filter(Boolean);
  const api = segs.indexOf('api');
  return (
    (api >= 0 && segs[api + 1] === 'preview') ||
    segs[segs.length - 1] === 'image.webp'
  );
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function pick(html: string, prop: string): string | undefined {
  const tag = html.match(
    new RegExp(`<meta[^>]*property="og:${prop}"[^>]*>`),
  )?.[0];
  const value = tag?.match(/content="([^"]*)"/)?.[1];
  return value ? unescapeHtml(value) : undefined;
}

const metaCache = new Map<string, Promise<OgMeta>>();

async function loadOgMeta(url: URL): Promise<OgMeta> {
  if (isImageUrl(url))
    return { image: url.pathname + (url.search || '') };
  const html = await (await fetch(url)).text();
  const image = pick(html, 'image');
  const resolved = image ? new URL(image, url) : undefined;
  return {
    title: pick(html, 'title'),
    description: pick(html, 'description'),
    image: resolved
      ? resolved.pathname + (resolved.search || '')
      : undefined,
  };
}

export function fetchOgMeta(raw: string): Promise<OgMeta> {
  const url = new URL(raw.trim(), window.location.origin);
  const key = url.href;
  let cached = metaCache.get(key);
  if (!cached) {
    if (metaCache.size > 200) {
      const first = metaCache.keys().next().value;
      if (first) metaCache.delete(first);
    }
    cached = loadOgMeta(url).catch((err) => {
      metaCache.delete(key);
      throw err;
    });
    metaCache.set(key, cached);
  }
  return cached;
}

export function useOgMeta(url?: string): {
  meta?: OgMeta;
  failed?: boolean;
} {
  const [state, setState] = useState<{
    url?: string;
    meta?: OgMeta;
    failed?: boolean;
  }>({});
  const raw = url?.trim();
  useEffect(() => {
    if (!raw) return;
    let live = true;
    fetchOgMeta(raw)
      .then((meta) => live && setState({ url: raw, meta }))
      .catch(() => live && setState({ url: raw, failed: true }));
    return () => {
      live = false;
    };
  }, [raw]);
  return raw && state.url === raw ? state : {};
}
