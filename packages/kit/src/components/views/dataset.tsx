import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LangContentSwitch } from '@terrafirmagreg-team/ui/components/blocks/lang/content';
import {
  datasetLandingMetadata,
  generateDatasetLandingParams,
  resolveDatasetLanding,
} from '@terrafirmagreg-team/kit/lib/landing';
import { sectionDatasets } from '@terrafirmagreg-team/kit/lib/datasets';
import type { DatasetLanding, SectionKey } from '@terrafirmagreg-team/kit/types';
import {
  localeLoader,
  registerLocaleRenderer,
} from '@terrafirmagreg-team/kit/lib/locale/renderer';
import { langContent } from '@terrafirmagreg-team/translate/server';

interface DatasetPageParams {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function createDatasetLandingPage<S extends SectionKey>(
  section: S,
  render: (page: DatasetLanding) => ReactNode,
) {
  registerLocaleRenderer(section, {
    resolve: async (slug, lang) =>
      resolveDatasetLanding(section, slug, lang, await sectionDatasets(section)),
    render: (page) => render(page as DatasetLanding),
  });

  async function Page({ params }: DatasetPageParams) {
    const { slug } = await params;
    const datasets = await sectionDatasets(section);
    const content = langContent(
      slug,
      (s, l) => resolveDatasetLanding(section, s, l, datasets),
      render,
    );
    if (!content) notFound();
    return (
      <LangContentSwitch
        key={[section, ...(slug ?? [])].join('/')}
        content={content}
        loadLang={localeLoader()?.bind(null, { section, slug })}
      />
    );
  }

  function generateStaticParams() {
    return generateDatasetLandingParams(section);
  }

  async function generateMetadata({
    params,
  }: DatasetPageParams): Promise<Metadata> {
    const { slug } = await params;
    return datasetLandingMetadata(
      section,
      slug,
      await sectionDatasets(section),
    );
  }

  return { Page, generateStaticParams, generateMetadata };
}

