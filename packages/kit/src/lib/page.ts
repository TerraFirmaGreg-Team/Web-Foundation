import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { firstLocalizedPage } from '@terrafirmagreg-team/translate/server';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { stripLangFromUrl, toInternalSlugs, toPublicSlug } from '@terrafirmagreg-team/translate/lib/slug';
import { sourceLanguages } from './languages';
import { sectionDatasets } from './datasets';
import { canonicalUrl, getPageImageUrl } from './urls';
import type { SectionKey, SectionPage, SectionSource } from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type { SectionSource } from '@terrafirmagreg-team/kit/types';
export { getDatasetImageUrl } from './urls';

export function getPage<S extends SectionSource>(
  source: S,
  slug: string[] | undefined,
  lang: Lang,
): ReturnType<S['getPage']> {
  return source.getPage(toInternalSlugs(slug, lang)) as ReturnType<S['getPage']>;
}

export function resolvePage<S extends SectionSource>(
  source: S,
  slug: string[] | undefined,
  lang: Lang,
) {
  const { defaultLanguage } = loadLocaleRegistry();
  const exact = getPage(source, slug, lang);
  if (exact) return { page: exact, isFallback: false as const };
  if (lang === defaultLanguage) return undefined;
  const fallback = getPage(source, slug, defaultLanguage);
  if (!fallback) return undefined;
  return { page: fallback, isFallback: true as const };
}

export async function generateDatasetParams(
  section: SectionKey,
  source: SectionSource,
): Promise<{ slug: string[] }[]> {
  const params = generatePageParams(source);
  const seen = new Set(params.map((row) => row.slug.join('/')));
  for (const { id } of await sectionDatasets(section)) {
    if (!seen.has(id)) {
      seen.add(id);
      params.push({ slug: [id] });
    }
  }
  return params.length ? params : [{ slug: ['_'] }];
}

export function generatePageParams(source: SectionSource): { slug: string[] }[] {
  const languages = sourceLanguages(source);
  const seen = new Set<string>();
  const params: { slug: string[] }[] = [];
  for (const page of source.getPages()) {
    const slug = toPublicSlug(page.slugs, languages);
    const key = slug.join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({ slug });
  }
  return params;
}

export async function sectionMetadata(
  section: SectionKey,
  source: SectionSource,
  slug: string[] | undefined,
): Promise<Metadata> {
  const page = firstLocalizedPage(slug, (s, l) => getPage(source, s, l));
  if (!page) notFound();
  const doc = page as SectionPage;
  const url = canonicalUrl(
    stripLangFromUrl(doc.url, sourceLanguages(source)),
  );
  return {
    title: doc.data.title,
    description: doc.data.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: doc.data.title,
      description: doc.data.description,
      images: [
        {
          url: canonicalUrl(getPageImageUrl(section, doc.slugs).url),
          width: 1200,
          height: 630,
          type: 'image/webp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.data.title,
      description: doc.data.description,
    },
  };
}

