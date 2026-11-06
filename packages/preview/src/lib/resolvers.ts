import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

export interface PreviewResolverCtx {

  parts: string[];
  query: URLSearchParams;
  lang: Lang;
  langMap: Record<string, string>;
}

export type PreviewResolver = (
  ctx: PreviewResolverCtx,
) => Promise<PagePreviewData | undefined>;

export interface PreviewResolverOptions {

  langMap?: (dataset: DatasetRef, lang: Lang) => Promise<Record<string, string>>;
}

const resolvers = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.preview.resolvers')
] ??= new Map<
  string,
  { resolve: PreviewResolver; langMap?: PreviewResolverOptions['langMap'] }
>()) as Map<
  string,
  { resolve: PreviewResolver; langMap?: PreviewResolverOptions['langMap'] }
>;

export function registerPreviewResolver(
  section: string,
  resolve: PreviewResolver,
  options?: PreviewResolverOptions,
): void {
  resolvers.set(section, { resolve, langMap: options?.langMap });
}

export function getPreviewResolver(section: string) {
  return resolvers.get(section);
}

function parseHref(href: string | undefined) {
  if (!href || /^(https?:|mailto:|\/\/|#)/i.test(href)) return undefined;
  const [withoutHash] = href.split('#');
  const [pathname, qs] = withoutHash.split('?');
  if (!pathname.startsWith('/')) return undefined;
  return {
    withoutHash,
    query: new URLSearchParams(qs),
    parts: pathname.split('/').filter(Boolean),
  };
}

export async function resolveLinkPreview(
  href: string,
  lang?: string,
): Promise<PagePreviewData | undefined> {
  const parsed = parseHref(href);
  if (!parsed) return undefined;
  const resolvedLang = (parsed.query.get('lang') ?? lang) as Lang | undefined;
  const entry = resolvers.get(parsed.parts[0] ?? '');
  if (entry && resolvedLang) {
    const dataset = parsed.parts[1];
    if (!dataset) return undefined;
    const langMap = entry.langMap
      ? await entry.langMap(
          {
            id: dataset,
            version: parsed.query.get('version') ?? undefined,
          },
          resolvedLang,
        )
      : {};
    return entry.resolve({
      parts: parsed.parts,
      query: parsed.query,
      lang: resolvedLang,
      langMap,
    });
  }
  const data = await loadPreviewData();
  const key = parsed.parts.join('/');
  const row =
    (resolvedLang && data.pages[resolvedLang]?.[key]) ??
    data.pages[data.default]?.[key];
  if (!row) return undefined;
  return {
    title: row.t,
    description: row.d,
    icon: row.i ? { type: 'icon' as const, name: row.i } : undefined,
  };
}

type PreviewDataFile = {
  default: string;
  pages: Record<string, Record<string, { t: string; d?: string; i?: string }>>;
};

let previewData: Promise<PreviewDataFile> | undefined;

function loadPreviewData(): Promise<PreviewDataFile> {
  previewData ??= fetch('/api/preview/data.json')
    .then((res) => (res.ok ? res.json() : { default: '', pages: {} }))
    .catch(() => ({ default: '', pages: {} }));
  return previewData;
}

export async function loadClientPreviews(
  lang: Lang,
  langMap: Record<string, string>,
  hrefs: Iterable<string>,
): Promise<Record<string, PagePreviewData>> {
  const out: Record<string, PagePreviewData> = {};
  await Promise.all(
    [...hrefs].map(async (href) => {
      const parsed = parseHref(href);
      if (!parsed) return;
      const entry = resolvers.get(parsed.parts[0] ?? '');
      if (!entry) return;
      const preview = await entry.resolve({
        parts: parsed.parts,
        query: parsed.query,
        lang,
        langMap,
      });
      if (preview) out[href] = preview;
    }),
  );
  return out;
}

