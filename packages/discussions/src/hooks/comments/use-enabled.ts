'use client';

import { useMemo, useSyncExternalStore } from 'react';

let enabled: boolean | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function makeSubscribe(configUrl: string) {
  return function subscribe(listener: () => void) {
    listeners.add(listener);
    if (enabled === null && !pending) {
      pending = fetch(configUrl)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          enabled = Boolean(data?.enabled);
        })
        .catch(() => {
          enabled = false;
        })
        .finally(() => listeners.forEach((notify) => notify()));
    }
    return () => {
      listeners.delete(listener);
    };
  };
}

export function useCommentsEnabled(configUrl: string): boolean {
  const subscribe = useMemo(() => makeSubscribe(configUrl), [configUrl]);
  return useSyncExternalStore(
    subscribe,
    () => enabled === true,
    () => false,
  );
}

