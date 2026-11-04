'use client';

export function replaceUrlState(href: string) {
  window.history.replaceState(null, '', href);
}

export function pushUrlState(href: string) {
  window.history.pushState(null, '', href);
}

