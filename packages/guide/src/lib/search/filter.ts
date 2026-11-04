import { registerSearchHitFilter } from '@terrafirmagreg-team/search/lib';
import type { SortedResult } from '@terrafirmagreg-team/ui/types/search';

export function guideHitFilter(
  params: URLSearchParams,
): ((hit: SortedResult) => boolean) | undefined {
  const book = params.get('book');
  if (!book) return undefined;
  return (hit) => {
    const queryString = hit.url.split('?')[1];
    if (!queryString) return true;
    const docBook = new URLSearchParams(queryString).get('book');
    return docBook === null || docBook === book;
  };
}

registerSearchHitFilter('guide', guideHitFilter);

