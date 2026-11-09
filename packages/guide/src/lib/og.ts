import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { ogRefSprite } from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import {
  ogName,
  registerOgResolver,
  type OgContext,
} from '@terrafirmagreg-team/preview/lib';
import { findClientGuideEntry, loadClientGuideBook } from './client/books';

async function guideOgContext(
  dataset: DatasetRef,
  search: URLSearchParams,
  lang: Lang,
): Promise<OgContext> {
  const entryId = search.get('entry');
  if (entryId) {
    const hit = await findClientGuideEntry(dataset, lang, entryId);
    if (!hit) return {};
    return {
      entity: {
        kind: 'entry',
        ...ogName(hit.entry.name ?? entryId),
      },
      icon: await ogRefSprite(dataset, hit.entry.icon),
      description:
        [hit.bookName, hit.categoryName].filter(Boolean).join(' · ') ||
        undefined,
      imageQuery: `entry=${encodeURIComponent(entryId)}`,
    };
  }
  const bookId = search.get('book');
  if (!bookId) return {};
  const overview = await loadClientGuideBook(dataset, lang, bookId);
  if (!overview) return {};
  const cat = search.get('cat');
  if (cat) {
    const category = overview.categories.find((row) => row.id === cat);
    if (!category) return {};
    return {
      entity: {
        kind: 'category',
        ...ogName(category.name),
      },
      icon: await ogRefSprite(dataset, category.icon),
      description: [
        overview.book?.name,
        `${category.entries.length} entr${category.entries.length === 1 ? 'y' : 'ies'}`,
      ]
        .filter(Boolean)
        .join(' · '),
      imageQuery: `book=${encodeURIComponent(bookId)}&cat=${encodeURIComponent(cat)}`,
    };
  }
  const book = overview.book;
  if (!book) return {};
  return {
    entity: { kind: 'book', ...ogName(book.name) },
    icon: await ogRefSprite(dataset, book.cover ?? undefined),
    description: `${overview.entries.length} entr${overview.entries.length === 1 ? 'y' : 'ies'}`,
    imageQuery: `book=${encodeURIComponent(bookId)}`,
  };
}

registerOgResolver('guide', guideOgContext);
