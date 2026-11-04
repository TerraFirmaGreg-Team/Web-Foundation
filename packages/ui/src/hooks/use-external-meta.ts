'use client';
import { useEffect, useState } from 'react';
import {
  DEFAULT_EXTERNAL_META_PROVIDERS,
  uiConfig,
  type ExternalMetaProvider,
} from '@terrafirmagreg-team/ui/lib/config';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';

export interface ExternalMeta {
  title: string;
  description?: string;
  host: string;
}

const metaCache = createAsyncCache((href: string) =>
  resolveMeta(new URL(href), AbortSignal.timeout(6000)),
);

function pick(data: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      data,
    );
}

function pickText(data: unknown, path?: string): string | undefined {
  const value = path ? pick(data, path) : undefined;
  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
}

function buildUrl(
  template: string,
  url: URL,
  match: RegExpMatchArray | null,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key === 'href') return encodeURIComponent(url.href);
    if (key === 'host') return url.hostname;
    const group = match?.[Number(key)];
    return group !== undefined ? encodeURIComponent(group) : '';
  });
}

async function fetchMeta(
  provider: ExternalMetaProvider,
  url: URL,
  match: RegExpMatchArray | null,
  signal: AbortSignal,
): Promise<ExternalMeta> {
  const res = await fetch(buildUrl(provider.url, url, match), { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const host = url.hostname;
  if (provider.kind === 'html') {
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    return {
      title:
        doc
          .querySelector("meta[property='og:title']")
          ?.getAttribute('content')
          ?.trim() ||
        doc.title ||
        host,
      description:
        doc
          .querySelector(
            "meta[property='og:description'], meta[name='description']",
          )
          ?.getAttribute('content') || undefined,
      host,
    };
  }
  const data = await res.json();
  let title = pickText(data, provider.title) || host;
  for (const [pattern, to] of provider.replace ?? []) {
    title = title.replace(pattern, to);
  }
  return { title, description: pickText(data, provider.description), host };
}

async function resolveMeta(url: URL, signal: AbortSignal): Promise<ExternalMeta> {
  const host = url.hostname;
  for (const provider of uiConfig().externalMetaProviders ??
    DEFAULT_EXTERNAL_META_PROVIDERS) {
    if (!provider.host.test(host)) continue;
    const match = provider.path ? url.pathname.match(provider.path) : null;
    if (provider.path && !match) continue;
    try {
      return await fetchMeta(provider, url, match, signal);
    } catch {

    }
  }
  return { title: host, host };
}

export function loadExternalMeta(href: string): Promise<ExternalMeta> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return Promise.resolve({ title: href, host: '' });
  }
  if (!/^https?:$/i.test(url.protocol)) {
    return Promise.resolve({ title: href, host: url.hostname });
  }
  return metaCache(href);
}

export function useExternalMeta(
  href: string,
  active: boolean,
): ExternalMeta | null {
  const [meta, setMeta] = useState<ExternalMeta | null>(null);
  useEffect(() => {
    if (!active) return;
    let mounted = true;
    void loadExternalMeta(href).then((m) => {
      if (mounted) setMeta(m);
    });
    return () => {
      mounted = false;
    };
  }, [href, active]);
  return meta;
}

