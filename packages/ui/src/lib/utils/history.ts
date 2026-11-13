'use client';

import { publishLocationSearch } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';

function publishSearch(href: string) {
  const queryAt = href.indexOf('?');
  if (queryAt < 0) {
    publishLocationSearch('');
    return;
  }
  const hashAt = href.indexOf('#', queryAt);
  publishLocationSearch(
    href.slice(queryAt + 1, hashAt < 0 ? undefined : hashAt),
  );
}

export function replaceUrlState(href: string) {
  window.history.replaceState(null, '', href);
  publishSearch(href);
}

export function pushUrlState(href: string) {
  window.history.pushState(null, '', href);
  publishSearch(href);
}
