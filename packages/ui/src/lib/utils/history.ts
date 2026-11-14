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

function sameUrl(href: string): boolean {
  return new URL(href, window.location.href).href === window.location.href;
}

function tryWrite(write: () => void): boolean {
  try {
    write();
    return true;
  } catch {
    return false;
  }
}

function writeUrlState(href: string, write: (href: string) => void) {
  if (sameUrl(href)) return;
  tryWrite(() => write(href));
  publishSearch(href);
}

export function replaceUrlState(href: string) {
  writeUrlState(href, (next) => window.history.replaceState(null, '', next));
}

export function pushUrlState(href: string) {
  writeUrlState(href, (next) => window.history.pushState(null, '', next));
}
