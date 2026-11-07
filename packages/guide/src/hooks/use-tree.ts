'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import type * as PageTree from 'fumadocs-core/page-tree';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useDumpRetryNonce } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { loadClientGuideBook } from '@terrafirmagreg-team/guide/lib/client/books';
import { listGuideBooks } from '@terrafirmagreg-team/guide/lib/book/list';
import { guideTreeChildren } from '@terrafirmagreg-team/guide/components/tree/children';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function useGuideTree(
  dataset: DatasetRef | undefined,
  lang: Lang,
  bookId: string | undefined,
): { value: PageTree.Root | undefined; pending: boolean; error: unknown } {
  const nonce = useDumpRetryNonce();
  return useAsyncResult(
    dataset
      ? async () => {
          const summaries = await listGuideBooks(dataset, lang);
          if (!summaries.length) return undefined;
          const resolvedId = bookId ?? summaries[0]?.bookId;
          const index = resolvedId
            ? await loadClientGuideBook(dataset, lang, resolvedId)
            : undefined;
          return {
            name: 'guide',
            children: index ? guideTreeChildren(dataset, index) : [],
            $id: `guide/${dataset.id}/${dataset.version ?? ''}/${resolvedId ?? 'none'}/${lang}`,
          } satisfies PageTree.Root;
        }
      : undefined,
    [dataset, lang, bookId, nonce],
  );
}
