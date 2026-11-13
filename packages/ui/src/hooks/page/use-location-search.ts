'use client';

import { useMemo, useSyncExternalStore } from 'react';

let search = typeof window === 'undefined' ? '' : window.location.search.slice(1);
const listeners = new Set<() => void>();

export function publishLocationSearch(value: string) {
  if (search === value) return;
  search = value;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onPopState = () => {
    search = window.location.search.slice(1);
    for (const entry of listeners) entry();
  };
  window.addEventListener('popstate', onPopState);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', onPopState);
  };
}

export function useLocationSearch(): string {
  return useSyncExternalStore(
    subscribe,
    () => search,
    () => '',
  );
}

export function useLocationSearchParams(): URLSearchParams {
  const search = useLocationSearch();
  return useMemo(() => new URLSearchParams(search), [search]);
}

