import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import {
  WorkspaceBody,
  WorkspaceDescription,
  WorkspaceTitle,
} from '@terrafirmagreg-team/ui/components/layouts/workspace';
import { PageActions } from '@terrafirmagreg-team/kit/components/page-actions';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import type {
  SectionPageView,
  SectionWorkspaceProps,
} from '@terrafirmagreg-team/kit/components/views/section';
import type {
  SectionFeatures,
  SectionPageContext,
} from '@terrafirmagreg-team/kit/types/features';
import type { SectionPage } from '@terrafirmagreg-team/kit/types';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { pageFeatureNodes } from '@terrafirmagreg-team/kit/components/page-features';
import { docsPageFeatures } from '@terrafirmagreg-team/docs/components/page-features';
import { GithubInfo } from '@terrafirmagreg-team/ui/components/blocks/git/github-info';
import { UntranslatedCallout } from '@terrafirmagreg-team/ui/components/blocks/lang/untranslated-callout';
import { getMDXComponents } from '@terrafirmagreg-team/mdx/components/mdx-components';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type { MDXContent } from 'mdx/types';
import type { TableOfContents } from '@terrafirmagreg-team/kit/components/toc/base';

export type DocsPageContext = SectionPageContext;

export type DocsBrowserFeatures = SectionFeatures;

export interface ResolvedDocsPage {
  page: SectionPage;
  toc: TableOfContents;
  body: ReactNode;
  ctx: DocsPageContext;
  repoSlug?: string[];
  mdUrl: string;
}

export async function resolveDocsPage(
  page: SectionPage,
  link: SectionWorkspaceProps['link'],
  contentDir: string,
  copied: TranslationState | undefined,
  history: boolean | undefined,
): Promise<ResolvedDocsPage> {
  const { body: MDX, toc, _exports } = (await (
    page.data as unknown as {
      load(): Promise<{
        body: MDXContent;
        toc: TableOfContents;
        _exports?: Record<string, unknown>;
      }>;
    }
  ).load()) as {
    body: MDXContent;
    toc: TableOfContents;
    _exports?: Record<string, unknown>;
  };
  const filePath = `${contentDir}/${page.path.replace(/\\/g, '/')}`;
  const datasetId = page.url.split('/').filter(Boolean)[1];
  const dataset = datasetId
    ? sectionConfig().datasetConfig[datasetId]
    : undefined;
  const { languages } = loadLocaleRegistry();
  return {
    page,
    toc,
    body: <MDX components={getMDXComponents({ a: link })} />,
    ctx: { page, filePath, datasetId, copied, history, exports: _exports },
    repoSlug: page.slugs.length === 2
      ? dataset?.github?.repo?.split('/')
      : undefined,
    mdUrl: `${stripLangFromUrl(page.url, [...languages])}.md${
      page.locale ? `?lang=${page.locale}` : ''
    }`,
  };
}

export function DocsBrowser({
  resolved,
  copied,
  features,
}: {
  resolved: ResolvedDocsPage;
  copied?: TranslationState;
  features: DocsBrowserFeatures;
}) {
  const { page, body, ctx, repoSlug, mdUrl } = resolved;
  const dataset = ctx.datasetId
    ? sectionConfig().datasetConfig[ctx.datasetId]
    : undefined;
  const slots = pageFeatureNodes(
    ctx,
    { ...docsPageFeatures, ...features },
    body,
  );
  return (
    <>
      <UntranslatedCallout copied={copied} />
      <WorkspaceTitle>{page.data.title}</WorkspaceTitle>
      <WorkspaceDescription className="mb-0">
        {page.data.description}
      </WorkspaceDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <PageActions
          copied={copied}
          crowdinUrl={dataset?.crowdin?.url}
          mdUrl={mdUrl}
          githubUrl={features.fileUrl?.(ctx.filePath)}
        />
        {slots.actionsRight}
      </div>
      {repoSlug ? (
        <GithubInfo
          owner={repoSlug[0]}
          repo={repoSlug[1]}
          className="not-prose mb-6 w-full"
        />
      ) : null}
      <WorkspaceBody>{slots.body}</WorkspaceBody>
      {slots.footer}
      {page.data.comments !== false ? slots.comments : null}
    </>
  );
}

export async function docsPage({
  page,
  link,
  contentDir,
  copied,
  crumbs = [],
  previews,
  footer,
  history = true,
  features = {},
}: SectionWorkspaceProps & {
  features?: DocsBrowserFeatures;
}): Promise<SectionPageView> {
  if (page.data.redirect) redirect(page.data.redirect);
  const resolved = await resolveDocsPage(
    page,
    link,
    contentDir,
    copied,
    history,
  );
  return {
    node: (
      <DocsBrowser
        resolved={resolved}
        copied={copied}
        features={features}
      />
    ),
    workspace: {
      toc: resolved.toc,
      full: page.data.full,
      className: 'min-h-full',
      breadcrumb: { items: crumbs, previews },
      pagination: { items: footer },
    },
  };
}

export function DocsBrowserFallback() {
  return (
    <WorkspaceBody className="flex flex-col gap-3">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-1 h-8 w-2/3 max-w-sm" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="mt-6 flex flex-col gap-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[94%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </WorkspaceBody>
  );
}
