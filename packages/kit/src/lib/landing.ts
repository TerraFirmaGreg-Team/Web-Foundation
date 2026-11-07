import 'server-only';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { sectionUrl } from '@terrafirmagreg-team/sites/location';
import { canonicalUrl, getDatasetImageUrl } from './urls';
import { datasetSlugs, findDataset } from './datasets';
import type {
  DatasetLanding,
  SectionDataset,
  SectionKey,
} from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function getDatasetLanding(
  section: SectionKey,
  slug: string[] | undefined,
  lang: Lang,
  datasets: readonly SectionDataset[],
): DatasetLanding | undefined {
  if (!slug || slug.length !== 1) return undefined;
  const [ref] = slug;
  const meta = findDataset(datasets, { id: ref });
  if (!meta) return undefined;
  const { messages, defaultLanguage } = loadLocaleRegistry();
  const table = messages[lang] ?? messages[defaultLanguage] ?? {};
  return {
    title: table[`sections.${section}`] ?? section,
    description: table[`sections.desc.${section}`],
    dataset: { id: ref },
    datasetTitle: meta.title ?? meta.id,
    lang,
    ...(meta.versions ? { versions: meta.versions } : {}),
  };
}

export function datasetLandingMetadata(
  section: SectionKey,
  slug: string[] | undefined,
  datasets: readonly SectionDataset[],
): Metadata {
  const page = getDatasetLanding(section, slug, 'en_us', datasets);
  if (!page) notFound();
  const meta = findDataset(datasets, { id: slug?.[0] ?? '' });
  const description = page.description ?? meta?.description;
  const title = page.datasetTitle ?? page.title;
  const url = canonicalUrl(`${sectionUrl(section)}/${(slug ?? []).join('/')}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: getDatasetImageUrl(section, slug?.[0] ?? '').url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function resolveDatasetLanding(
  section: SectionKey,
  slug: string[] | undefined,
  lang: Lang,
  datasets: readonly SectionDataset[],
): { page: DatasetLanding; isFallback: boolean } | undefined {
  const page = getDatasetLanding(section, slug, lang, datasets);
  return page ? { page, isFallback: false } : undefined;
}

export async function generateDatasetLandingParams(
  section: SectionKey,
): Promise<{ slug: string[] }[]> {
  return (await datasetSlugs(section)).map((ref) => ({ slug: [ref] }));
}

