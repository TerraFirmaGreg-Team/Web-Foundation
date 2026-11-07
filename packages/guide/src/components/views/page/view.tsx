'use client';
import { useMemo } from 'react';
import { EntryProvider } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  useWorkspaceSlots,
  type WorkspaceSlots,
} from '@terrafirmagreg-team/kit/components/views/frame';
import {
  WorkspaceBody,
  WorkspaceDescription,
  WorkspaceTitle,
} from '@terrafirmagreg-team/ui/components/layouts/workspace';
import { guideConfig } from '@terrafirmagreg-team/guide/lib/config';
import { GithubInfo } from '@terrafirmagreg-team/ui/components/blocks/git/github-info';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { categoryMap, guideBreadcrumbItems } from '@terrafirmagreg-team/guide/lib/nav/breadcrumb';
import { guideToc } from '@terrafirmagreg-team/guide/lib/nav/toc';
import { GuideText } from '@terrafirmagreg-team/guide/components/views/text';
import { GuideOverviewBody } from '@terrafirmagreg-team/guide/components/views/page/overview-body';
import { GuideCategoryBody } from '@terrafirmagreg-team/guide/components/views/page/category-body';
import { GuideEntryBody } from '@terrafirmagreg-team/guide/components/views/page/entry-body';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/display/messages';
import { CommentsSlot } from '@terrafirmagreg-team/discussions/components/comments';
import {
  guideBookHref,
  guideCategoryHref,
} from '@terrafirmagreg-team/guide/lib/nav/paths';
import type { GuideIndex, GuidePagePayload } from '@terrafirmagreg-team/guide/types';

type NavItem = { name: string; url: string };

function guideNavItems(
  payload: GuidePagePayload,
  overview: GuideIndex | undefined,
): { previous?: NavItem; next?: NavItem } {
  const modId = payload.bookModId ?? payload.modId;
  const bookPath = payload.bookPath;
  if (!overview || !modId || !bookPath) return {};
  const { dataset, lang } = payload;
  const chain: NavItem[] = [];
  if (overview.book)
    chain.push({
      name: overview.book.name,
      url: guideBookHref(dataset, lang, modId, bookPath),
    });
  for (const category of overview.categories) {
    chain.push({
      name: category.name,
      url: guideCategoryHref(dataset, lang, modId, bookPath, category),
    });
    for (const entry of category.entries)
      chain.push({
        name: entry.name,
        url: guideBookHref(dataset, lang, modId, bookPath, entry.id),
      });
  }
  const current =
    payload.kind === 'entry' && payload.entry
      ? guideBookHref(dataset, lang, modId, bookPath, payload.entry.id)
      : payload.kind === 'category' && payload.categoryId
        ? guideCategoryHref(dataset, lang, modId, bookPath, {
            id: payload.categoryId,
          })
        : payload.kind === 'overview'
          ? guideBookHref(dataset, lang, modId, bookPath)
          : undefined;
  const index = current
    ? chain.findIndex((item) => item.url === current)
    : -1;
  return {
    previous: index > 0 ? chain[index - 1] : undefined,
    next:
      index >= 0 && index < chain.length - 1 ? chain[index + 1] : undefined,
  };
}

export function GuidePageView({
  payload,
  langMap,
}: {
  payload: GuidePagePayload;
  langMap: Record<string, string>;
}) {
  const { dataset, lang, kind } = payload;
  const overview: GuideIndex | undefined =
    payload.book !== undefined || payload.categories !== undefined
      ? {
          status: payload.book ? 'ready' : 'missing',
          root: '',
          modId: payload.bookModId ?? payload.modId ?? '',
          bookPath: payload.bookPath,
          book: payload.book ?? null,
          categories: payload.categories ?? [],
          entries: payload.entries ?? [],
          language: lang,
          isFallback: false,
        }
      : undefined;
  const categories = overview
    ? categoryMap(overview.categories)
    : new Map<string, string>();
  const labels = {
    related: guideMessage(payload.messages, 'guide.related'),
    objective: guideMessage(payload.messages, 'guide.objective'),
  };

  let toc: ReturnType<typeof guideToc> | undefined;
  let body: React.ReactNode = null;

  switch (kind) {
    case 'pack':
      break;
    case 'overview':
      if (overview) {
        body = (
          <GuideOverviewBody
            dataset={dataset}
            lang={lang}
            modId={payload.modId}
            bookPath={payload.bookPath}
            overview={overview}
            categories={categories}
            langMap={langMap}
            questLinks={payload.questLinks}
            previews={payload.previews}
            messages={payload.messages}
          />
        );
      }
      break;
    case 'category':
      body = (
        <GuideCategoryBody
          dataset={dataset}
          lang={lang}
          modId={payload.modId}
          bookPath={payload.bookPath}
          overview={overview}
          categoryId={payload.categoryId}
          messages={payload.messages}
        />
      );
      break;
    case 'entry':
      toc = guideToc(
        payload.entry?.pages,
        langMap,
        labels,
        payload.extras?.entityNames,
      );
      body = overview && payload.bookPath && (
        <GuideEntryBody
          dataset={dataset}
          lang={lang}
          bookPath={payload.bookPath}
          overview={overview}
          entry={payload.entry}
          categories={categories}
          langMap={langMap}
          extras={payload.extras}
          questLinks={payload.questLinks}
          previews={payload.previews}
          messages={payload.messages}
        />
      );
      break;
    default: {
      const _exhaustive: never = kind;
      body = <p>{String(_exhaustive)}</p>;
    }
  }

  const copied =
    payload.entry?.translation ??
    overview?.categories.find((item) => item.id === payload.categoryId)
      ?.translation ??
    payload.book?.translation;

  const crumbs = guideBreadcrumbItems({
    kind,
    title: payload.title,
    dataset,
    modId: payload.modId,
    bookPath: payload.bookPath,
    overview,
    categoryId: payload.categoryId,
  });

  const datasetConf =
    sectionConfig().datasetConfig[dataset.id];
  const repoSlug = datasetConf?.repo?.split('/');
  const mdQuery = new URLSearchParams();
  if (payload.modId && payload.bookPath) {
    mdQuery.set('book', `${payload.modId}:${payload.bookPath}`);
  }
  if (kind === 'entry' && payload.entry) {
    mdQuery.set('entry', payload.entry.id);
  } else if (kind === 'category' && payload.categoryId) {
    mdQuery.set('cat', payload.categoryId);
  }
  mdQuery.set('lang', lang);
  const mdUrl = `/guide/${dataset.id}.md?${mdQuery}`;

  const nav = guideNavItems(payload, overview);
  const {
    PageActions,
    UntranslatedCallout,
  } = guideConfig().components;

  const slots = useMemo<WorkspaceSlots>(
    () => ({
      toc: toc ?? [],
      breadcrumb: { items: crumbs, previews: payload.previews },
      pagination: { items: nav },
      full: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [payload, langMap],
  );
  useWorkspaceSlots(slots, [slots]);

  return (
    <EntryProvider dataset={dataset} lang={lang} langMap={langMap}>
      <div className="flex flex-col gap-4 min-h-full">
        <UntranslatedCallout copied={copied} />
        <WorkspaceTitle>
          {kind === 'entry' && payload.previewIcon ? (
            <span className="inline-flex items-center gap-2">
              <Entry
                id={payload.previewIcon}
                kind={payload.previewKind}
                name={payload.title}
                href={false}
                tooltip={false}
              />
              {payload.title}
            </span>
          ) : (
            payload.title
          )}
        </WorkspaceTitle>
        {payload.description ? (
          <WorkspaceDescription className="mb-0">
            <GuideText
              text={payload.description}
              dataset={dataset}
              lang={lang}
              modId={payload.modId}
              bookPath={payload.bookPath}
              categoryByEntry={categories}
              macros={overview?.book?.macros}
              langMap={langMap}
              questLinks={payload.questLinks}
              previews={payload.previews}
            />
          </WorkspaceDescription>
        ) : null}
        <div className="flex flex-row gap-2 items-center border-b pb-6">
          <PageActions
            copied={copied}
            crowdinUrl={datasetConf?.crowdin}
            mdUrl={mdUrl}
            githubUrl={
              datasetConf?.repo
                ? `https://github.com/${datasetConf.repo}`
                : undefined
            }
          />
        </div>
        {kind === 'pack' && repoSlug ? (
          <GithubInfo
            owner={repoSlug[0]}
            repo={repoSlug[1]}
            className="not-prose mb-6 w-full"
          />
        ) : null}
        <WorkspaceBody>
          <div data-md-root className="contents">
            {body}
          </div>
        </WorkspaceBody>
        <CommentsSlot
          page={`guide:${dataset.id}:${payload.modId}:${payload.bookPath}:${payload.entry?.id ?? payload.categoryId ?? 'book'}#${lang}`}
        />
      </div>
    </EntryProvider>
  );
}

