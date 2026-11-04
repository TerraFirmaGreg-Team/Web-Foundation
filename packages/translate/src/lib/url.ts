import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

const QUERY_SAFE = /[A-Za-z0-9\-._~:/[\]@!$'()*{},;|]/u;

export function encodeQueryValue(value: string): string {
  return Array.from(value, (ch) =>
    QUERY_SAFE.test(ch) ? ch : encodeURIComponent(ch),
  ).join('');
}

export function encodeQuery(
  entries: Iterable<readonly [string, string | number | undefined]>,
): string {
  const parts: string[] = [];
  for (const [key, value] of entries) {
    if (value === undefined || value === '') continue;
    parts.push(`${encodeQueryValue(key)}=${encodeQueryValue(String(value))}`);
  }
  return parts.join('&');
}

const toQuery = (params: URLSearchParams): string => {
  const parts: string[] = [];
  for (const [key, value] of params) {
    parts.push(`${encodeQueryValue(key)}=${encodeQueryValue(value)}`);
  }
  return parts.join('&');
};

const splitFragment = (fragment: string): { anchor: string; params: URLSearchParams } => {
  const sep = fragment.indexOf('&');
  if (sep === -1) return { anchor: fragment, params: new URLSearchParams() };
  return {
    anchor: fragment.slice(0, sep),
    params: new URLSearchParams(fragment.slice(sep + 1)),
  };
};

export function langFromFragment(hash: string): string | undefined {
  if (!hash.includes('&')) return undefined;
  return splitFragment(hash.startsWith('#') ? hash.slice(1) : hash).params.get('lang') ?? undefined;
}

let effectiveDefault: Lang | undefined;

export function publishDefaultLang(lang: Lang | undefined): void {
  effectiveDefault = lang;
}

export function hrefWithLang(href: string, lang: Lang, fallback?: Lang): string {
  if (!href || href.startsWith('//')) return href;
  const hashIndex = href.indexOf('#');
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : href.slice(hashIndex + 1);
  const qIndex = path.indexOf('?');
  const qs = qIndex === -1 ? '' : path.slice(qIndex + 1);
  const existing =
    new URLSearchParams(qs).get('lang') ?? langFromFragment(fragment) ?? null;
  const def = fallback ?? effectiveDefault;
  if (existing !== null) {

    if (existing === def) return withLang(href, def, fallback);
    return href;
  }
  return withLang(href, lang, fallback);
}

export function withLang(href: string, lang: Lang, fallback?: Lang): string {
  const isDefault = lang === (fallback ?? effectiveDefault);
  const hashIndex = href.indexOf('#');
  const path = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : href.slice(hashIndex + 1);
  const qIndex = path.indexOf('?');
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const existing = qIndex === -1 ? '' : path.slice(qIndex + 1);
  const params = new URLSearchParams(existing);
  if (!fragment) {
    if (isDefault) params.delete('lang');
    else params.set('lang', lang);
    const q = toQuery(params);
    return `${pathname}${q ? `?${q}` : ''}`;
  }
  const { anchor, params: fragParams } = splitFragment(fragment);
  params.delete('lang');
  if (isDefault) fragParams.delete('lang');
  else fragParams.set('lang', lang);
  const fragQuery = toQuery(fragParams);
  const q = toQuery(params);
  const frag = fragQuery ? `${anchor}&${fragQuery}` : anchor;
  return `${pathname}${q ? `?${q}` : ''}#${frag}`;
}

