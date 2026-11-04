import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import {
  Workspace,
  WorkspaceBody,
  WorkspaceDescription,
  WorkspaceTitle,
} from '@terrafirmagreg-team/kit/components/workspace';
import { PageActions } from '@terrafirmagreg-team/kit/components/page-actions';
import type { SectionWorkspaceProps } from '@terrafirmagreg-team/kit/components/views/section';
import type { SectionPage } from '@terrafirmagreg-team/kit/types';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { GithubInfo } from '@terrafirmagreg-team/ui/components/blocks/git/github-info';
import { UntranslatedCallout } from '@terrafirmagreg-team/ui/components/blocks/lang/untranslated-callout';
import { getMDXComponents } from '@terrafirmagreg-team/mdx/components/mdx-components';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type { MDXContent } from 'mdx/types';
import type { TableOfContents } from '@terrafirmagreg-team/kit/components/toc/base';

export interface DocsPageContext {
  page: SectionPage;
  filePath: string;
  datasetId?: string;
  copied?: TranslationState;
  history?: boolean;
}

export interface DocsBrowserFeatures {
  fileUrl?: (filePath: string) => string;
  actionsRight?: (ctx: DocsPageContext) => ReactNode;
  wrapBody?: (body: ReactNode, ctx: DocsPageContext) => ReactNode;
  footer?: (ctx: DocsPageContext) => ReactNode;
  comments?: (ctx: DocsPageContext) => ReactNode;
}

export async function DocsBrowser({
  page,
  link,
  contentDir,
  copied,
  crumbs = [],
  previews,
  footer,
  history = true,
  features = {},
}: SectionWorkspaceProps & { features?: DocsBrowserFeatures }) {
  if (page.data.redirect) redirect(page.data.redirect);
  const { body: MDX, toc } = (await (
    page.data as unknown as {
      load(): Promise<{ body: MDXContent; toc: TableOfContents }>;
    }
  ).load()) as { body: MDXContent; toc: TableOfContents };
  const body = <MDX components={getMDXComponents({ a: link })} />;
  const filePath = `${contentDir}/${page.path.replace(/\\/g, '/')}`;
  const datasetId = page.url.split('/').filter(Boolean)[1];
  const dataset = datasetId
    ? sectionConfig().datasetConfig[datasetId]
    : undefined;
  const { languages } = loadLocaleRegistry();
  const repoSlug =
    page.slugs.length === 2 ? dataset?.repo?.split('/') : undefined;
  const ctx: DocsPageContext = { page, filePath, datasetId, copied, history };

  return (
    <Workspace
      toc={toc}
      full={page.data.full}
      className="min-h-full"
      breadcrumb={{ items: crumbs, previews }}
      pagination={{ items: footer }}
    >
      <UntranslatedCallout copied={copied} />
      <WorkspaceTitle>{page.data.title}</WorkspaceTitle>
      <WorkspaceDescription className="mb-0">
        {page.data.description}
      </WorkspaceDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <PageActions
          copied={copied}
          crowdinUrl={dataset?.crowdin}
          title={page.data.title}
          mdUrl={`${stripLangFromUrl(page.url, [...languages])}.md${
            page.locale ? `?lang=${page.locale}` : ''
          }`}
          githubUrl={features.fileUrl?.(filePath)}
        />
        {features.actionsRight?.(ctx)}
      </div>
      {repoSlug ? (
        <GithubInfo
          owner={repoSlug[0]}
          repo={repoSlug[1]}
          className="not-prose mb-6 w-full"
        />
      ) : null}
      <WorkspaceBody>
        {features.wrapBody ? (
          features.wrapBody(body, ctx)
        ) : (
          <div data-md-root className="contents">
            {body}
          </div>
        )}
      </WorkspaceBody>
      {features.footer?.(ctx)}
      {page.data.comments !== false ? features.comments?.(ctx) : null}
    </Workspace>
  );
}
