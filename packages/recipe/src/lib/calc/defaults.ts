import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
const KEY_PREFIX = 'calc:recipe-defaults:';

function parseDefaults(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
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

const defaultsKey = (dataset: DatasetRef) => `${KEY_PREFIX}${dataset.id}`;

export function readRecipeDefaults(dataset: DatasetRef): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return parseDefaults(window.localStorage.getItem(defaultsKey(dataset)));
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
    window.localStorage.setItem(defaultsKey(dataset), JSON.stringify(next));
  } catch {

  }
  window.dispatchEvent(new Event(EVENT));
  return next;
}

const migrated = new Set<string>();

export function migrateRecipeDefaults(dataset: DatasetRef): void {
  if (typeof window === 'undefined') return;
  const canonical = defaultsKey(dataset);
  if (migrated.has(canonical)) return;
  migrated.add(canonical);
  try {
    const legacy: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const name = window.localStorage.key(i);
      if (name && name.startsWith(`${canonical}/`)) legacy.push(name);
    }
    if (!legacy.length) return;
    const merged: Record<string, string> = {};
    for (const name of legacy) {
      Object.assign(
        merged,
        parseDefaults(window.localStorage.getItem(name)),
      );
    }
    Object.assign(merged, readRecipeDefaults(dataset));
    window.localStorage.setItem(canonical, JSON.stringify(merged));
    for (const name of legacy) window.localStorage.removeItem(name);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    return;
  }
}
