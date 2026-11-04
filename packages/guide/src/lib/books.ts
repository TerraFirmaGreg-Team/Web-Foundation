import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { listClientGuideBookSummaries } from '@terrafirmagreg-team/guide/lib/client/guides';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

type GuideBookSummary = Awaited<
  ReturnType<typeof listClientGuideBookSummaries>
>[number];

function orderGuideBooks<T extends { bookId: string }>(
  books: T[],
  order: readonly string[] | undefined,
): T[] {
  if (!order?.length) return books;
  const rank = new Map(order.map((id, i) => [id, i]));
  return [...books].sort(
    (a, b) =>
      (rank.get(a.bookId) ?? order.length) - (rank.get(b.bookId) ?? order.length) ||
      a.bookId.localeCompare(b.bookId),
  );
}

export function listGuideBooks(
  dataset: DatasetRef,
  lang: Lang,
): Promise<GuideBookSummary[]> {
  return listClientGuideBookSummaries(dataset, lang).then((books) =>
    orderGuideBooks(books, sectionConfig().datasetConfig[dataset.id]?.guide?.bookOrder),
  );
}

