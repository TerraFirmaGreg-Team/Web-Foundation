'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import {
  useAsyncResult,
  useAsyncValue,
} from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useLastResult } from '@terrafirmagreg-team/ui/hooks/use-last-result';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import {
  isDatasetFailed,
  useDumpRetryNonce,
  useFailedDatasets,
} from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import {
  DumpUnavailable,
  DumpUnavailableOverlay,
} from '@terrafirmagreg-team/kit/components/views/unavailable';
import { StaleBadge } from '@terrafirmagreg-team/kit/components/dump-status/stale-badge';
import { useLangMap } from '@terrafirmagreg-team/game/hooks/use-lang-map';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import {
  RightSidebarPanel,
  RightSidebarPortal,
} from '@terrafirmagreg-team/ui/components/layouts/right-sidebar';
import { WorkspaceBody } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import { useWorkspaceSlots } from '@terrafirmagreg-team/kit/components/views/frame';
import { TextIcon } from 'lucide-react';
import { GuidePageView } from '@terrafirmagreg-team/guide/components/views/page/view';
import {
  firstGuideEntryId,
  guideQueryFromParams,
} from '@terrafirmagreg-team/guide/lib/nav/query';
import { getGuideSource } from '@terrafirmagreg-team/guide/lib/source';
import { guideHref } from '@terrafirmagreg-team/guide/lib/links';
import { guideConfig } from '@terrafirmagreg-team/guide/lib/config';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideMessages } from '@terrafirmagreg-team/guide/types';

const GUIDE_TOC_SKELETON = [
  { depth: 0, w: 'w-3/4' },
  { depth: 1, w: 'w-2/3' },
  { depth: 1, w: 'w-1/2' },
  { depth: 0, w: 'w-4/5' },
  { depth: 1, w: 'w-3/5' },
  { depth: 2, w: 'w-1/2' },
  { depth: 0, w: 'w-2/3' },
];

export function GuideTocSkeleton() {
  const t = useTranslations();
  return (
    <RightSidebarPortal>
      <RightSidebarPanel className="pt-8 pb-4">
        <div aria-hidden className="flex flex-1 flex-col gap-3 overflow-clip">
          <h3 className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <TextIcon className="size-4" />
            {t('On this page', { note: 'ui.on_this_page' })}
          </h3>
          <div className="flex flex-col gap-2.5 pt-1">
            {GUIDE_TOC_SKELETON.map((item, i) => (
              <Skeleton
                key={i}
                className={`h-3.5 ${item.w}`}
                style={{ marginLeft: `${item.depth * 14}px` }}
              />
            ))}
          </div>
        </div>
      </RightSidebarPanel>
    </RightSidebarPortal>
  );
}

export function GuideBrowserFallback() {
  useWorkspaceSlots(
    useMemo(() => ({ outline: <GuideTocSkeleton /> }), []),
    [],
  );
  return (
    <WorkspaceBody className="flex flex-col gap-3">
      <Skeleton className="h-3.5 w-44" />
      <Skeleton className="mt-1 h-8 w-2/3 max-w-sm" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-4/5 max-w-sm" />
      <div className="mt-6 flex flex-col gap-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[96%]" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </WorkspaceBody>
  );
}

export function GuideBrowser({
  dataset: id,
  datasetTitle,
  lang,
  versions,
}: {
  dataset: string;
  datasetTitle: string;
  lang: Lang;
  versions?: readonly string[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const params = useLocationSearchParams();
  const dataset = useVersionedDataset(id, { versions }) ?? { id };
  const { bookId, entryId, categoryId } = useMemo(
    () => guideQueryFromParams(params),
    [params],
  );
  const source = getGuideSource();
  const nonce = useDumpRetryNonce();
  const failed = isDatasetFailed(useFailedDatasets(), dataset);
  const books = useLastResult(
    useAsyncResult(
      () => source.books(dataset, lang),
      [dataset, lang, nonce],
    ),
    dataset.id,
  );
  const langMap = useLangMap(dataset, lang);
  const messages = useMemo<GuideMessages>(
    () => ({
      'guide.related': t('Related', { note: 'guide.related' }),
      'guide.objective': t('Objective', { note: 'guide.objective' }),
      'guide.link': t('Open', { note: 'guide.link' }),
      'guide.quest': t('Quest', { note: 'guide.quest' }),
      'guide.recipe_empty': t('No recipes', { note: 'guide.recipe_empty' }),
      'guide.entity_unavailable': t('Entity preview unavailable', {
        note: 'guide.entity_unavailable',
      }),
      'guide.entry_missing': t('Entry not found', {
        note: 'guide.entry_missing',
      }),
      'guide.entry_count': t('{count} entries', {
        note: 'guide.entry_count',
      }),
      'guide.page_count': t('{count} pages', { note: 'guide.page_count' }),
    }),
    [t],
  );

  const resolved = useResolvedLang();
  const canonical = useAsyncValue(
    books.value && !bookId
      ? async () => {
          const book = books.value?.[0];
          if (!book) return undefined;
          const index = await source.book(dataset, lang, book.bookId);
          const first = index ? firstGuideEntryId(index) : undefined;
          return guideHref(dataset, resolved, book.bookId, first);
        }
      : undefined,
    [books.value, bookId, dataset, lang, resolved],
  );

  useEffect(() => {
    if (canonical) router.replace(canonical);
  }, [canonical, router]);

  const payload = useLastResult(
    useAsyncResult(
      langMap && bookId
        ? () =>
            source.payload(
              dataset,
              lang,
              bookId,
              entryId,
              categoryId,
              langMap,
              messages,
            )
        : undefined,
      [dataset, lang, bookId, entryId, categoryId, langMap, messages, nonce],
    ),
    `${dataset.id}:${bookId ?? ''}`,
  );

  useEffect(() => {
    if (payload.value?.title) {
      document.title = `${payload.value.title} · ${datasetTitle} | ${guideConfig().appName}`;
    }
  }, [payload.value?.title, datasetTitle]);

  const unavailable = (
    <div className="relative min-h-0 flex-1">
      <GuideBrowserFallback />
      <DumpUnavailableOverlay>
        <DumpUnavailable>
          {t('Guide data is temporarily unavailable. Try again later.', {
            note: 'guide.unavailable',
          })}
        </DumpUnavailable>
      </DumpUnavailableOverlay>
    </div>
  );

  if (
    books.error ||
    (!books.pending && !books.value?.length) ||
    (failed && !books.value?.length)
  ) {
    return unavailable;
  }
  if (!bookId || !langMap || payload.pending) {
    return <GuideBrowserFallback />;
  }
  if (!payload.value) {
    return payload.error ? (
      unavailable
    ) : (
      <WorkspaceBody>
        <EmptyState variant="missing">
          {t('Entry not found', { note: 'guide.entry_missing' })}
        </EmptyState>
      </WorkspaceBody>
    );
  }
  return (
    <div className="relative flex-1">
      {books.stale || payload.stale ? <StaleBadge /> : null}
      <GuidePageView payload={payload.value} langMap={langMap} />
    </div>
  );
}

