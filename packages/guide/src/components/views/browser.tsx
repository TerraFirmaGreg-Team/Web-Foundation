'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useLangMap } from '@terrafirmagreg-team/game/hooks/use-lang-map';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import {
  Workspace,
  WorkspaceBody,
} from '@terrafirmagreg-team/kit/components/workspace';
import { GuidePageView } from '@terrafirmagreg-team/guide/components/views/page/view';
import {
  firstGuideEntryId,
  guideQueryFromParams,
} from '@terrafirmagreg-team/guide/lib/query';
import { loadClientGuidePayload } from '@terrafirmagreg-team/guide/lib/client-payload';
import { listGuideBooks } from '@terrafirmagreg-team/guide/lib/books';
import { loadClientGuideBook } from '@terrafirmagreg-team/guide/lib/client/guides';
import { guideHref } from '@terrafirmagreg-team/guide/lib/links';
import { guideConfig } from '@terrafirmagreg-team/guide/lib/config';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideMessages } from '@terrafirmagreg-team/guide/types';

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
  const books = useAsyncValue(
    () => listGuideBooks(dataset, lang),
    [dataset, lang],
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

  const canonical = useAsyncValue(
    books && !bookId
      ? async () => {
          const book = books[0];
          if (!book) return undefined;
          const index = await loadClientGuideBook(dataset, lang, book.bookId);
          const first = index ? firstGuideEntryId(index) : undefined;
          return guideHref(dataset, lang, book.bookId, first);
        }
      : undefined,
    [books, bookId, dataset, lang],
  );

  useEffect(() => {
    if (canonical) router.replace(canonical);
  }, [canonical, router]);

  const payload = useAsyncValue(
    langMap && bookId
      ? () =>
          loadClientGuidePayload(
            dataset,
            lang,
            bookId,
            entryId,
            categoryId,
            langMap,
            messages,
          )
      : undefined,
    [dataset, lang, bookId, entryId, categoryId, langMap, messages],
  );

  useEffect(() => {
    if (payload?.title) {
      document.title = `${payload.title} · ${datasetTitle} | ${guideConfig().appName}`;
    }
  }, [payload?.title, datasetTitle]);

  if (!bookId || !payload || !langMap) {
    return (
      <Workspace toc={[]}>
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
      </Workspace>
    );
  }
  return <GuidePageView payload={payload} langMap={langMap} />;
}

