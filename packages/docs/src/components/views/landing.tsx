import { notFound, redirect } from 'next/navigation';
import { createRelativeLink } from '@terrafirmagreg-team/kit/components/relative-link';
import type {
  SectionLandingProps,
  SectionLandingView,
} from '@terrafirmagreg-team/kit/components/views/routes';
import type {
  SectionPage,
  SectionSource,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import {
  sectionBreadcrumbItems,
  sectionBreadcrumbPreviews,
} from '@terrafirmagreg-team/kit/lib/breadcrumb';
import { getPage, resolvePage } from '@terrafirmagreg-team/kit/lib/page';
import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source';
import { findNeighbour } from 'fumadocs-core/page-tree';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { lookupPagePreview } from '@terrafirmagreg-team/kit/lib/preview/lookup';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import {
  readPageSource,
  translationState,
} from '@terrafirmagreg-team/translate/server';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { Suspense } from 'react';
import {
  DocsBrowser,
  DocsBrowserFallback,
  resolveDocsPage,
} from '@terrafirmagreg-team/docs/components/views/browser';

export async function docsLanding({
  page,
  lang,
  source,
  trees,
  catalog,
  contentDir,
  history,
  features = {},
}: SectionLandingProps<SectionSource>): Promise<SectionLandingView> {
  if (!source || !catalog) notFound();
  const dataset = page.dataset.id;
  const docsPage = getPage(source, [dataset], lang) as SectionPage | undefined;
  if (!docsPage) {
    const first = (function firstPage(
      nodes: NonNullable<NonNullable<SectionTrees[Lang]>[string]>['children'],
    ): { url: string } | undefined {
      for (const node of nodes ?? []) {
        if (node.type === 'page') return node;
        const found =
          'children' in node && node.children ? firstPage(node.children) : undefined;
        if (found) return found;
      }
      return undefined;
    })(trees?.[lang]?.[dataset]?.children ?? []);
    if (first) redirect(first.url);
    notFound();
  }
  const { defaultLanguage } = loadLocaleRegistry();
  let copied: TranslationState | undefined;
  if (lang !== defaultLanguage) {
    const fallback = resolvePage(source, [dataset], defaultLanguage)?.page as
      | SectionPage
      | undefined;
    if (fallback && fallback !== docsPage) {
      const own = readPageSource(contentDir, docsPage.path);
      const original = readPageSource(contentDir, fallback.path);
      if (own && original) {
        const state = translationState(own, original);
        if (state !== 'ok') copied = state;
      }
    }
  }
  const crumbs = sectionBreadcrumbItems(source, docsPage, lang);
  const tree = trees?.[lang]?.[dataset];
  const neighbours = tree ? findNeighbour(tree, docsPage.url) : undefined;
  const link = createRelativeLink(
    source as LoaderOutput<LoaderConfig>,
    docsPage as unknown as Page,
    (props) => (
      <LinkPreview
        preview={lookupPagePreview(catalog, props.href, lang)}
        {...props}
      />
    ),
  );
  const resolved = await resolveDocsPage(
    docsPage,
    link,
    contentDir,
    copied,
    history,
  );
  return {
    node: (
      <Suspense fallback={<DocsBrowserFallback />}>
        <DocsBrowser
          resolved={resolved}
          copied={copied}
          features={features}
        />
      </Suspense>
    ),
    workspace: {
      toc: resolved.toc,
      full: docsPage.data.full,
      className: 'min-h-full',
      breadcrumb: {
        items: crumbs,
        previews: sectionBreadcrumbPreviews(crumbs, lang, catalog),
      },
      pagination: { items: neighbours },
    },
  };
}
