import { createRelativeLink } from '@terrafirmagreg-team/kit/components/relative-link';
import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { lookupPagePreview } from '@terrafirmagreg-team/kit/lib/preview/lookup';
import {
  sectionBreadcrumbItems,
  sectionBreadcrumbPreviews,
  type SectionCrumb,
} from '@terrafirmagreg-team/kit/lib/breadcrumb';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { readPageSource, translationState } from '@terrafirmagreg-team/translate/server';
import { resolvePage, type SectionSource } from '@terrafirmagreg-team/kit/lib/page';
import { findNeighbour } from 'fumadocs-core/page-tree';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import type {
  DatasetCatalog,
  SectionPage,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import { PageFrame } from '@terrafirmagreg-team/kit/components/views/frame';
import type { WorkspaceViewProps } from '@terrafirmagreg-team/kit/components/views/frame';
import type { WorkspacePaginationItems } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import type { SectionFeatures } from '@terrafirmagreg-team/kit/types/features';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type { ComponentProps, ReactNode } from 'react';
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
  features?: SectionFeatures;
}

export interface SectionPageView {
  node: ReactNode;
  workspace?: WorkspaceViewProps;
}

export function renderSectionView(view: SectionPageView) {
  return <PageFrame {...view.workspace}>{view.node}</PageFrame>;
}

export type SectionPageViewFn = (
  props: SectionWorkspaceProps,
) => SectionPageView | Promise<SectionPageView>;

export async function renderSectionWorkspace({
  source,
  slug,
  contentDir,
  trees,
  catalog,
  history,
  features,
  workspace: pageView,
  page,
  lang,
}: {
  source: SectionSource;
  slug: string[] | undefined;
  contentDir: string;
  trees?: SectionTrees;
  catalog: DatasetCatalog;
  history?: boolean;
  features?: SectionFeatures;
  workspace: SectionPageViewFn;
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
  const pageUrl = stripLangFromUrl(page.url, [
    ...sectionConfig().knownLanguages,
  ]);
  const neighbours = tree ? findNeighbour(tree, pageUrl) : undefined;
  const view = await pageView({
    page,
    crumbs,
    footer: neighbours,
    previews: sectionBreadcrumbPreviews(crumbs, lang, catalog),
    link: createRelativeLink(
      source as LoaderOutput<LoaderConfig>,
      page as unknown as Page,
      (props) => (
        <LinkPreview
          preview={lookupPagePreview(catalog, props.href, lang)}
          {...props}
        />
      ),
    ),
    contentDir,
    copied,
    history,
    features,
  });
  return renderSectionView(view);
}

