import { createRelativeLink } from '@terrafirmagreg-team/kit/components/relative-link';
import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source';
import { notFound } from 'next/navigation';
import { LangContentSwitch } from '@terrafirmagreg-team/ui/components/blocks/lang/content';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { lookupPagePreview } from '@terrafirmagreg-team/kit/lib/preview/lookup';
import {
  sectionBreadcrumbItems,
  sectionBreadcrumbPreviews,
  type SectionCrumb,
} from '@terrafirmagreg-team/kit/lib/breadcrumb';
import { langContent } from '@terrafirmagreg-team/translate/server';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { readPageSource, translationState } from '@terrafirmagreg-team/translate/server';
import { resolvePage, type SectionSource } from '@terrafirmagreg-team/kit/lib/page';
import { localeLoader } from '@terrafirmagreg-team/kit/lib/locale/renderer';
import { findNeighbour } from 'fumadocs-core/page-tree';
import type {
  DatasetCatalog,
  SectionKey,
  SectionPage,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import type { WorkspacePaginationItems } from '@terrafirmagreg-team/kit/components/workspace';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type {
  ComponentProps,
  ComponentType,
  ReactNode,
} from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export interface SectionWorkspaceProps {
  page: SectionPage;
  link: (props: ComponentProps<'a'>) => ReactNode | Promise<ReactNode>;
  contentDir: string;
  copied?: TranslationState;
  crumbs?: SectionCrumb[];
  previews?: Record<string, PagePreviewData>;
  footer?: WorkspacePaginationItems;
  history?: boolean;
}

export function renderSectionWorkspace({
  source,
  slug,
  contentDir,
  trees,
  catalog,
  history,
  workspace: Workspace,
  page,
  lang,
}: {
  source: SectionSource;
  slug: string[] | undefined;
  contentDir: string;
  trees?: SectionTrees;
  catalog: DatasetCatalog;
  history?: boolean;
  workspace: ComponentType<SectionWorkspaceProps>;
  page: SectionPage;
  lang: Lang;
}) {
  const { defaultLanguage } = loadLocaleRegistry();
  let copied: 'untranslated' | 'partial' | undefined;
  if (lang !== defaultLanguage) {
    const fallback = resolvePage(source, slug, defaultLanguage)?.page as
      | SectionPage
      | undefined;
    if (fallback && fallback !== page) {
      const own = readPageSource(contentDir, page.path);
      const original = readPageSource(contentDir, fallback.path);
      if (own && original) {
        const state = translationState(own, original);
        if (state !== 'ok') copied = state;
      }
    }
  }
  const crumbs = sectionBreadcrumbItems(source, page, lang);
  const datasetId = page.url.split('/').filter(Boolean)[1];
  const tree = datasetId ? trees?.[lang]?.[datasetId] : undefined;
  const neighbours = tree ? findNeighbour(tree, page.url) : undefined;
  return (
    <Workspace
      page={page}
      crumbs={crumbs}
      footer={neighbours}
      previews={sectionBreadcrumbPreviews(crumbs, lang, catalog)}
      link={createRelativeLink(
        source as LoaderOutput<LoaderConfig>,
        page as unknown as Page,
        (props) => (
          <LinkPreview
            preview={lookupPagePreview(catalog, props.href, lang)}
            {...props}
          />
        ),
      )}
      contentDir={contentDir}
      copied={copied}
      history={history}
    />
  );
}

export async function SectionView({
  section,
  getSource,
  slug,
  contentDir,
  trees,
  catalog,
  history,
  workspace,
}: {
  section: SectionKey;
  getSource: () => Promise<SectionSource>;
  slug: string[] | undefined;
  contentDir: string;
  trees?: SectionTrees;
  catalog: DatasetCatalog;
  history?: boolean;
  workspace: ComponentType<SectionWorkspaceProps>;
}) {
  const source = await getSource();
  const content = langContent(
    slug,
    (s, l) => resolvePage(source, s, l),
    (page, lang) =>
      renderSectionWorkspace({
        source,
        slug,
        contentDir,
        trees,
        catalog,
        history,
        workspace,
        page: page as SectionPage,
        lang,
      }),
  );
  if (!content) notFound();
  return (
    <LangContentSwitch
      content={content}
      loadLang={localeLoader()?.bind(null, { section, slug })}
    />
  );
}

