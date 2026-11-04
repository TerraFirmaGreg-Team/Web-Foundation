import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
const KEY_PREFIX = 'calc:recipe-defaults:';

export function readRecipeDefaults(dataset: DatasetRef): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}${dataset.id}/${dataset.version ?? ''}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
      return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([key, value]) =>
          typeof key === 'string' && typeof value === 'string',
      ) as [string, string][],
    );
  } catch {
    return {};
  }
}

const EVENT = 'tfg:recipe-defaults';

export function subscribeRecipeDefaults(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

export function writeRecipeDefault(
  dataset: DatasetRef,
  materialId: string,
  recipeId: string | null,
): Record<string, string> {
  const next = readRecipeDefaults(dataset);
  if (recipeId === null) delete next[materialId];
  else next[materialId] = recipeId;
  try {
    window.localStorage.setItem(`${KEY_PREFIX}${dataset.id}/${dataset.version ?? ''}`, JSON.stringify(next));
  } catch {

  }
  window.dispatchEvent(new Event(EVENT));
  return next;
}

