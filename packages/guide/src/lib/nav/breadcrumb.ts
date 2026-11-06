import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { guideBookHref, guideCategoryHref } from '@terrafirmagreg-team/guide/lib/nav/paths';
import type { GuideCategory, GuideIndex, GuidePageKind } from '@terrafirmagreg-team/guide/types';

export function categoryMap(
  categories: GuideCategory[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of categories) {
    for (const entry of cat.entries) {
      map.set(entry.id, cat.id);
    }
  }
  return map;
}

export function guideBreadcrumbItems({
  kind,
  title,
  dataset,
  modId,
  bookPath,
  overview,
  categoryId,
}: {
  kind: GuidePageKind;
  title: string;
  dataset: DatasetRef;
  modId?: string;
  bookPath?: string;
  overview: GuideIndex | undefined;
  categoryId?: string;
}): Array<{ name: string; url?: string }> {
  if (kind === 'pack') return [];
  const bookName = overview?.book?.name ?? bookPath ?? '';
  const bookHref =
    modId && bookPath
      ? guideBookHref(dataset, undefined, modId, bookPath)
      : undefined;
  if (kind === 'overview') return [];
  const items: Array<{ name: string; url?: string }> = [];
  if (bookName && bookHref) items.push({ name: bookName, url: bookHref });
  const cat = overview?.categories.find((entry) => entry.id === categoryId);
  if (cat && modId && bookPath) {
    items.push({
      name: cat.name,
      url:
        kind === 'entry'
          ? guideCategoryHref(dataset, undefined, modId, bookPath, cat)
          : undefined,
    });
  }
  if (kind !== 'category' || !cat) items.push({ name: title });
  return items;
}

