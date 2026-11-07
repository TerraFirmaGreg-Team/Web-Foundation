import { redirect } from 'next/navigation';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import {
  ChangelogTimeline,
  type ChangelogTimelineEntry,
} from '@terrafirmagreg-team/changelog/components/timeline';
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
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { pageFeatureNodes } from '@terrafirmagreg-team/kit/components/page-features';
import { changelogPageFeatures } from '@terrafirmagreg-team/changelog/components/page-features';
import { UntranslatedCallout } from '@terrafirmagreg-team/ui/components/blocks/lang/untranslated-callout';
import { getMDXComponents } from '@terrafirmagreg-team/mdx/components/mdx-components';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type { MDXContent } from 'mdx/types';
import type { TableOfContents } from '@terrafirmagreg-team/kit/components/toc/base';
import type { SectionPage } from '@terrafirmagreg-team/kit/types';

export type ChangelogPageContext = SectionPageContext;

export type ChangelogPageFeatures = SectionFeatures;

export function ChangelogBrowser({
  entries,
  lang,
}: {
  entries: ChangelogTimelineEntry[];
  lang: Lang;
}) {
  return <ChangelogTimeline entries={entries} lang={lang} />;
}

export function ChangelogPageChrome({
  page,
  body,
  copied,
  ctx,
  dataset,
  features,
}: {
  page: SectionPage;
  body: React.ReactNode;
  copied?: TranslationState;
  ctx: ChangelogPageContext;
  dataset?: { crowdin?: string };
  features: ChangelogPageFeatures;
}) {
  const { languages } = loadLocaleRegistry();
  const slots = pageFeatureNodes(
    ctx,
    { ...changelogPageFeatures, ...features },
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
          crowdinUrl={dataset?.crowdin}
          title={page.data.title}
          mdUrl={`${stripLangFromUrl(page.url, [...languages])}.md${
            page.locale ? `?lang=${page.locale}` : ''
          }`}
          githubUrl={features.fileUrl?.(ctx.filePath)}
        />
        {slots.actionsRight}
      </div>
      <WorkspaceBody>{slots.body}</WorkspaceBody>
      {slots.footer}
      {page.data.comments !== false ? slots.comments : null}
    </>
  );
}

export async function changelogPage({
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
  features?: ChangelogPageFeatures;
}): Promise<SectionPageView> {
  if (page.data.redirect) redirect(page.data.redirect);
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
  const ctx: ChangelogPageContext = {
    page,
    filePath,
    datasetId,
    copied,
    history,
    exports: _exports,
  };
  const body = <MDX components={getMDXComponents({ a: link })} />;
  return {
    node: (
      <ChangelogPageChrome
        page={page}
        body={body}
        copied={copied}
        ctx={ctx}
        dataset={dataset}
        features={features}
      />
    ),
    workspace: {
      toc,
      full: page.data.full,
      className: 'min-h-full',
      breadcrumb: { items: crumbs, previews },
      pagination: { items: footer },
    },
  };
}

export function ChangelogBrowserFallback() {
  return (
    <div className="flex flex-col gap-8 pt-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col gap-2.5 border-l border-border ps-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
