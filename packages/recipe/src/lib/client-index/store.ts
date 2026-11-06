'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useSyncExternalStore } from 'react';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';

const indexes = new Map<string, RecipeCompactIndex>();
const listeners = new Set<() => void>();

function refKey(dataset: DatasetRef) {
  return `${dataset.id}/${dataset.version ?? ''}`;
}

function key(dataset: DatasetRef, lang: string) {
  return `${refKey(dataset)} ${lang}`;
}

const namesSnapshots = new Map<
  string,
  Record<string, Record<string, string>>
>();

function rebuildNames(dataset: DatasetRef) {
  const merged: Record<string, Record<string, string>> = {};
  for (const [k, index] of indexes) {
    if (!k.startsWith(`${refKey(dataset)} `)) continue;
    for (const [lang, names] of Object.entries(index.names ?? {})) {
      merged[lang] = { ...merged[lang], ...names };
    }
  }
  namesSnapshots.set(refKey(dataset), merged);
}

export function publishRecipeIndex(
  dataset: DatasetRef,
  lang: string,
  index: RecipeCompactIndex,
) {
  if (indexes.get(key(dataset, lang)) === index) return;
  indexes.set(key(dataset, lang), index);
  rebuildNames(dataset);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecipeIndexStore(
  dataset: DatasetRef,
  lang: string,
): RecipeCompactIndex | null {
  return useSyncExternalStore(
    subscribe,
    () => indexes.get(key(dataset, lang)) ?? null,
    () => null,
  );
}

export function useRecipeIndexNames(
  dataset: DatasetRef,
): Record<string, Record<string, string>> | null {
  return useSyncExternalStore(
    subscribe,
    () => namesSnapshots.get(refKey(dataset)) ?? null,
    () => null,
  );
}

