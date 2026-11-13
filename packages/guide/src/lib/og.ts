import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { ogIconParam } from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import {
  ogImageQuery,
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
    const icon = ogIconParam(hit.entry.icon);
    const entity = {
      kind: 'entry',
      ...ogName(hit.entry.name ?? entryId),
      ...(icon ? { icon } : {}),
    };
    const description =
      [hit.bookName, hit.categoryName].filter(Boolean).join(' · ') ||
      undefined;
    return { entity, description, imageQuery: ogImageQuery(entity, description) };
  }
  const bookId = search.get('book');
  if (!bookId) return {};
  const overview = await loadClientGuideBook(dataset, lang, bookId);
  if (!overview) return {};
  const cat = search.get('cat');
  if (cat) {
    const category = overview.categories.find((row) => row.id === cat);
    if (!category) return {};
    const icon = ogIconParam(category.icon);
    const entity = {
      kind: 'category',
      ...ogName(category.name),
      ...(icon ? { icon } : {}),
    };
    const description = [
      overview.book?.name,
      `${category.entries.length} entr${category.entries.length === 1 ? 'y' : 'ies'}`,
    ]
      .filter(Boolean)
      .join(' · ');
    return { entity, description, imageQuery: ogImageQuery(entity, description) };
  }
  const book = overview.book;
  if (!book) return {};
  const icon = ogIconParam(book.cover ?? undefined);
  const entity = {
    kind: 'book',
    ...ogName(book.name),
    ...(icon ? { icon } : {}),
  };
  const description = `${overview.entries.length} entr${overview.entries.length === 1 ? 'y' : 'ies'}`;
  return { entity, description, imageQuery: ogImageQuery(entity, description) };
}

registerOgResolver('guide', guideOgContext);
