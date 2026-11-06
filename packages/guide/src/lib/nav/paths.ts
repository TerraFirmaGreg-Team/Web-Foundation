import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideCategoryRef } from '@terrafirmagreg-team/guide/types';
import { guideHref as guideQueryHref } from '@terrafirmagreg-team/guide/lib/links';

export function bareId(id: string): string {
  const trimmed = id.replace(/^\/+|\/+$/g, '');
  return trimmed.includes(':')
    ? trimmed.slice(trimmed.indexOf(':') + 1)
    : trimmed;
}

export function bookOptionId(modId: string, bookPath: string): string {
  return `${modId}:${bookPath}`;
}

export function guideBookHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  modId?: string,
  bookPath?: string,
  entryId?: string,
  hash?: string,
  categoryId?: string,
): string {
  const bookId = modId && bookPath ? bookOptionId(modId, bookPath) : undefined;
  return guideQueryHref(dataset, lang, bookId, entryId, hash, categoryId);
}

export function guideCategoryHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  modId: string,
  bookPath: string,
  category: { id: string },
): string {
  return guideBookHref(
    dataset,
    lang,
    modId,
    bookPath,
    undefined,
    undefined,
    category.id,
  );
}

export function isRootCategory(
  _category: GuideCategoryRef,
  _all: GuideCategoryRef[],
): boolean {
  return true;
}

