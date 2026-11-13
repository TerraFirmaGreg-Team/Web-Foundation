'use client';

import { useEffect, useState, type DependencyList } from 'react';

type AsyncEffectBody = (
  isCancelled: () => boolean,
) => void | Promise<unknown> | (() => void);

export function useAsyncEffect(
  effect: AsyncEffectBody | false | null | undefined,
  deps: DependencyList,
): void {
  useEffect(() => {
    if (!effect) return;
    let cancelled = false;
    const cleanup = effect(() => cancelled);
    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps owned by caller
  }, deps);
}

export function useAsyncValue<T>(
  factory: (() => Promise<T>) | false | null | undefined,
  deps: DependencyList,
): T | undefined {
  return useAsyncResult(factory, deps).value;
}

export function useAsyncResult<T>(
  factory: (() => Promise<T>) | false | null | undefined,
  deps: DependencyList,
): { value: T | undefined; pending: boolean; error: unknown } {
  const [entry, setEntry] = useState<{
    deps: DependencyList;
    value: T | undefined;
    error?: unknown;
  }>();
  useAsyncEffect(async (isCancelled) => {
    if (!factory) return;
    for (let attempt = 0; ; attempt += 1) {
      try {
        const next = await factory();
        if (!isCancelled()) setEntry({ deps, value: next });
        return;
      } catch (error) {
        if (isCancelled()) return;
        if (attempt >= 1) {
          setEntry({ deps, value: undefined, error });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (isCancelled()) return;
      }
    }
  }, deps);
  const resolved =
    entry !== undefined &&
    entry.deps.length === deps.length &&
    entry.deps.every((dep, i) => Object.is(dep, deps[i]));
  return {
    value: factory && resolved ? entry?.value : undefined,
    pending: Boolean(factory) && !resolved,
    error: factory && resolved ? entry?.error : undefined,
  };
}

