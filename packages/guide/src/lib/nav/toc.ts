import type { TOCItemType } from 'fumadocs-core/toc';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import {
  classifyGuidePageType,
  collectItemIds,
  parseGuideIcon,
  parseGuideItems,
} from '@terrafirmagreg-team/guide/lib/data/parse';
import type { GuidePage } from '@terrafirmagreg-team/guide/lib/data/dto';
import { isIndexPage } from '@terrafirmagreg-team/guide/lib/page-kind';
import type { GuideTocLabels } from '@terrafirmagreg-team/guide/types';

function resourceIds(page: GuidePage): string[] {
  return [
    ...collectItemIds(page.item),
    ...collectItemIds(page.icon),
    page.entity,
    ...(page.recipes ?? []),
  ].filter((id): id is string => typeof id === 'string' && Boolean(id));
}

function localizedField(
  map: Record<string, string>,
  value: unknown,
): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const resolved = langString(map, value);
  if (resolved) return resolved;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return undefined;
  return value;
}

function typeOf(page: GuidePage): string {
  return (page.type ?? '').toLowerCase().trim();
}

export function pageTitle(
  page: GuidePage,
  langMap: Record<string, string> = {},
  labels: GuideTocLabels = {},
  entityNames?: Record<string, string>,
): string | undefined {
  const display =
    page.display &&
    typeof page.display === 'object' &&
    !Array.isArray(page.display)
      ? (page.display as Record<string, unknown>)
      : undefined;
  const fromFields =
    localizedField(langMap, page.title) ??
    localizedField(
      langMap,
      typeof display?.name === 'string' ? display.name : undefined,
    ) ??
    localizedField(langMap, page.name);
  if (fromFields && fromFields !== page.entity) return fromFields;

  const type = typeOf(page);
  if (type === 'relations') return labels.related;
  if (type === 'quest') return labels.objective;

  for (const id of resourceIds(page)) {
    const name = entityNames?.[id] ?? stackDisplayName(langMap, id);
    if (name !== id) return name;
  }
  return undefined;
}

export function pageAnchor(
  page: GuidePage,
  index: number,
  taken?: Set<string>,
): string {
  const anchor = typeof page.anchor === 'string' ? page.anchor.trim() : '';
  if (anchor && !taken?.has(anchor)) {
    taken?.add(anchor);
    return anchor;
  }
  return `page-${index + 1}`;
}

export function pageAnchors(pages: GuidePage[] | undefined): string[] {
  if (!pages?.length) return [];
  const taken = new Set<string>();
  return pages.map((page, i) => pageAnchor(page, i, taken));
}

export function pageIcon(page: GuidePage): TaggedReference | undefined {
  return pageIcons(page)[0];
}

export function pageIcons(page: GuidePage): TaggedReference[] {
  const kind = classifyGuidePageType(page.type);
  if (kind === 'entity') return [];
  const icon = parseGuideIcon(page.icon);
  if (icon) return [icon];
  return parseGuideItems(page.item);
}

export function guidePageTitles(
  pages: GuidePage[] | undefined,
  langMap: Record<string, string> = {},
  labels: GuideTocLabels = {},
  entityNames?: Record<string, string>,
): (string | undefined)[] {
  if (!pages?.length) return [];
  return pages.map((page) =>
    isIndexPage(page, langMap)
      ? undefined
      : pageTitle(page, langMap, labels, entityNames),
  );
}

export function repeatedTitle(
  titles: (string | undefined)[],
  index: number,
): boolean {
  return index > 0 && titles[index] !== undefined && titles[index] === titles[index - 1];
}

export function guideToc(
  pages: GuidePage[] | undefined,
  langMap: Record<string, string> = {},
  labels: GuideTocLabels = {},
  entityNames?: Record<string, string>,
): TOCItemType[] {
  const titles = guidePageTitles(pages, langMap, labels, entityNames);
  const anchors = pageAnchors(pages);
  return titles.flatMap((title, i) => {
    if (!title || repeatedTitle(titles, i)) return [];
    return [{ title, url: `#${anchors[i]}`, depth: 2 }];
  });
}

