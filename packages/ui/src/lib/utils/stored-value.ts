'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type StoredCodec<T> = {
  read: (raw: string | null) => T;
  write: (value: T) => string;
};

const listenersByKey = new Map<string, Set<() => void>>();
const memoryByKey = new Map<string, string>();

export function subscribeStoredValue(
  key: string,
  onChange: () => void,
): () => void {
  let set = listenersByKey.get(key);
  if (!set) {
    set = new Set();
    listenersByKey.set(key, set);
  }
  set.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === key) onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    set.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function readStoredValue<T>(
  key: string,
  read: (raw: string | null) => T,
): T {
  const memory = memoryByKey.get(key) ?? null;
  try {
    return read(memory ?? localStorage.getItem(key));
  } catch {
    return read(memory);
  }
}

export function writeStoredValue<T>(
  key: string,
  value: T,
  write: (v: T) => string,
) {
  const raw = write(value);
  try {
    localStorage.setItem(key, raw);
    memoryByKey.delete(key);
  } catch {
    memoryByKey.set(key, raw);
  }
  for (const listener of listenersByKey.get(key) ?? []) listener();
}

export function createStoredValue<T>(key: string, codec: StoredCodec<T>) {
  let cache: { raw: string | null; value: T } | undefined;
  const fallback = codec.read(null);

  const getSnapshot = (): T => {
    let raw: string | null = memoryByKey.get(key) ?? null;
    if (raw === null) {
      try {
        raw = localStorage.getItem(key);
      } catch {

      }
    }
    if (cache?.raw === raw) return cache.value;
    try {
      const value = codec.read(raw);
      cache = { raw, value };
      return value;
    } catch {
      return fallback;
    }
  };

  return function useStoredValue() {
    const value = useSyncExternalStore(
      (onChange) => subscribeStoredValue(key, onChange),
      getSnapshot,
      () => fallback,
    );
    const set = useCallback((next: T | ((prev: T) => T)) => {
      const value =
        typeof next === 'function' ? (next as (p: T) => T)(getSnapshot()) : next;
      writeStoredValue(key, value, codec.write);
    }, []);
    return [value, set] as const;
  };
}

export function boolCodec(defaultValue: boolean): StoredCodec<boolean> {
  return {
    read: (raw) => (raw == null ? defaultValue : raw !== '0' && raw !== 'false'),
    write: (value) => (value ? '1' : '0'),
  };
}

export function literalCodec<T extends string>(
  values: readonly T[],
  defaultValue: T,
): StoredCodec<T> {
  return {
    read: (raw) =>
      raw != null && (values as readonly string[]).includes(raw)
        ? (raw as T)
        : defaultValue,
    write: (value) => value,
  };
}

export function jsonCodec<T>(defaultValue: T): StoredCodec<T> {
  return {
    read: (raw) => (raw == null ? defaultValue : (JSON.parse(raw) as T)),
    write: (value) => JSON.stringify(value),
  };
}

export function numberCodec(
  defaultValue: number,
  min: number,
  max: number,
): StoredCodec<number> {
  const clamp = (value: number) =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : defaultValue;
  return {
    read: (raw) => (raw == null ? defaultValue : clamp(Number(raw))),
    write: (value) => String(clamp(value)),
  };
}

