import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { parseGuideIcon } from '@terrafirmagreg-team/guide/lib/data/parse';
import type {
  GuideBookJson,
  GuideBookRef,
} from '@terrafirmagreg-team/guide/lib/data/dto';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  GuideCategory,
  GuideEntry,
  GuideEntryRef,
  GuideIndex,
} from '@terrafirmagreg-team/guide/types';
import { toBook } from './convert';
import { fallbackTracker, localize, localizeGuideValue } from './localize';
import {
  type RawRecord,
  categoryMatches,
  compareGuideOrder,
  displayRecord,
  numeric,
  rawId,
  stringField,
} from './raw';

function toEntry(
  raw: RawRecord,
  fallbackId: string,
  langMap: Record<string, string>,
  contentLanguage: Lang,
  missing?: ReadonlySet<string>,
): GuideEntry {
  const id = rawId(raw, fallbackId);
  const display = displayRecord(raw);
  const nameKey = stringField(display, 'name');
  const tracker = fallbackTracker(missing);
  return {
    id,
    name: nameKey ? localize(langMap, nameKey, nameKey, tracker) : id,
    category: typeof raw.category === 'string' ? raw.category : undefined,
    icon: parseGuideIcon(raw.icon),
    pages: Array.isArray(raw.pages)
      ? (localizeGuideValue(raw.pages, langMap, tracker) as GuideEntry['pages'])
      : [],
    order: numeric(raw.order),
    contentLanguage,
    ...(tracker?.flag ? { translation: tracker.flag } : {}),
  };
}

function toCategory(
  raw: RawRecord,
  fallbackId: string,
  langMap: Record<string, string>,
  missing?: ReadonlySet<string>,
): Omit<GuideCategory, 'entries'> {
  const id = rawId(raw, fallbackId);
  const nameKey = stringField(raw, 'name');
  const tracker = fallbackTracker(missing);
  return {
    id,
    name: nameKey ? localize(langMap, nameKey, nameKey, tracker) : id,
    description: localizeGuideValue(
      stringField(raw, 'description'),
      langMap,
      tracker,
    ) as string | undefined,
    icon: parseGuideIcon(raw.icon),
    order: numeric(raw.order),
    ...(tracker?.flag ? { translation: tracker.flag } : {}),
  };
}

function refsForCategory(
  category: Omit<GuideCategory, 'entries'>,
  entries: GuideEntry[],
): GuideEntryRef[] {
  const matches = entries
    .filter((entry) => categoryMatches(category.id, entry.category))
    .sort(compareGuideOrder);
  return matches.map((entry) => ({
    id: entry.id,
    name: entry.name ?? entry.id,
    icon: entry.icon,
    pageCount: entry.pages?.length,
    order: entry.order,
    ...(entry.translation ? { translation: entry.translation } : {}),
  }));
}

export type BookRows = {
  ref: GuideBookRef;
  slug: string;
  raw?: GuideBookJson;
  entries: Array<{ id: string; raw: RawRecord }>;
  categories: Array<{ id: string; raw: RawRecord }>;
  contentLanguage: Lang;
  isFallback: boolean;
};

export function indexBookRows(
  rows: BookRows,
  dataset: DatasetRef,
  lang: Lang,
  langMap: Record<string, string>,
  missing?: ReadonlySet<string>,
): GuideIndex {
  const { ref, slug, raw } = rows;
  const entries = rows.entries.map((entryRow) =>
    toEntry(entryRow.raw, entryRow.id, langMap, rows.contentLanguage, missing),
  );
  const categoryRows = rows.categories.map((categoryRow) =>
    toCategory(categoryRow.raw, categoryRow.id, langMap, missing),
  );
  const categories: GuideCategory[] = categoryRows
    .sort(compareGuideOrder)
    .map((category) => ({
      ...category,
      entries: refsForCategory(category, entries),
    }));
  const book = toBook(raw, ref, slug, langMap, missing);
  return {
    status: categories.length || book.name ? 'ready' : 'missing',
    root: ref.dir,
    modId: ref.modId,
    bookId: ref.bookId,
    bookPath: ref.bookPath,
    bookSlug: slug,
    book,
    categories,
    entries: entries.sort(compareGuideOrder),
    language: lang,
    isFallback: rows.isFallback,
  };
}

