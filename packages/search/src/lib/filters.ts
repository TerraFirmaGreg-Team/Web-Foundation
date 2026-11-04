import type { SortedResult } from '@terrafirmagreg-team/ui/types/search';

export type SearchHitFilter = (hit: SortedResult) => boolean;
export type SearchHitFilterFactory = (
  params: URLSearchParams,
) => SearchHitFilter | undefined;

const hitFilters = new Map<string, SearchHitFilterFactory>();

export function registerSearchHitFilter(
  section: string,
  factory: SearchHitFilterFactory,
): void {
  hitFilters.set(section, factory);
}

export function searchHitFilter(
  section: string,
  params: URLSearchParams,
): SearchHitFilter | undefined {
  return hitFilters.get(section)?.(params);
}

