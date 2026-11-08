import type { CalculatorState } from '@terrafirmagreg-team/recipe/types/calc';
import {
  capHistory,
  EMPTY_ENTRIES,
  isCalcHistory,
  isCalcTabs,
  migrateCalcState,
  newCalcEntry,
  type CalcTreeEntry,
} from './entry';
import {
  activeKey,
  CALC_STATE_EVENT,
  emitCalcStorage,
  historyKey,
} from './keys';

function readJSON<T>(raw: string | null, guard: (v: unknown) => v is T): T | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return guard(value) ? value : null;
  } catch {
    return null;
  }
}

const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function snap<T>(
  storeKey: string,
  raw: string | null,
  guard: (v: unknown) => v is T,
  normalize?: (value: T) => void,
): T | null {
  const hit = snapshots.get(storeKey);
  if (hit && hit.raw === raw) return hit.value as T | null;
  const value = readJSON(raw, guard);
  if (value) normalize?.(value);
  snapshots.set(storeKey, { raw, value });
  return value;
}

const migrateEntries = (entries: CalcTreeEntry[]): void => {
  for (const entry of entries) {
    entry.state = migrateCalcState(entry.state);
  }
};

export function readCalcTabs(key: string): CalcTreeEntry[] {
  if (typeof window === 'undefined') return [];
  return (
    snap(key, window.localStorage.getItem(key), isCalcTabs, migrateEntries) ??
    EMPTY_ENTRIES
  );
}

export function readCalcActive(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(activeKey(key)) || null;
  } catch {
    return null;
  }
}

export function readCalcHistory(key: string): CalcTreeEntry[] {
  if (typeof window === 'undefined') return [];
  const hKey = historyKey(key);
  return (
    snap(hKey, window.localStorage.getItem(hKey), isCalcHistory, migrateEntries) ??
    EMPTY_ENTRIES
  );
}

function writeTabsRaw(key: string, tabs: CalcTreeEntry[]): void {
  window.localStorage.setItem(key, JSON.stringify(tabs));
}

function writeHistoryRaw(key: string, entries: CalcTreeEntry[]): void {
  window.localStorage.setItem(
    historyKey(key),
    JSON.stringify(capHistory(entries)),
  );
}

function syncHistory(key: string, tabs: CalcTreeEntry[]): void {
  const live = tabs.filter((tab) => tab.state.cards.length);
  if (!live.length) return;
  const prev = readCalcHistory(key);
  const ids = new Set(live.map((tab) => tab.id));
  writeHistoryRaw(key, [...live, ...prev.filter((e) => !ids.has(e.id))]);
}

export function writeCalcTabs(
  key: string,
  tabs: CalcTreeEntry[],
  active: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    writeTabsRaw(key, tabs);
    syncHistory(key, tabs);
    window.sessionStorage.setItem(activeKey(key), active ?? '');
  } catch {
    return;
  }
  emitCalcStorage();
}

export function writeCalcActive(key: string, id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(activeKey(key), id ?? '');
  } catch {
    return;
  }
  emitCalcStorage();
}

export function updateCalcTab(
  key: string,
  id: string,
  update: (entry: CalcTreeEntry) => CalcTreeEntry,
): void {
  if (typeof window === 'undefined') return;
  const tabs = readCalcTabs(key);
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index < 0) return;
  const next = tabs.slice();
  next[index] = update(next[index]!);
  try {
    writeTabsRaw(key, next);
    syncHistory(key, next);
  } catch {
    return;
  }
  emitCalcStorage();
}

export function removeCalcHistory(key: string, id: string): void {
  if (typeof window === 'undefined') return;
  try {
    writeHistoryRaw(
      key,
      readCalcHistory(key).filter((entry) => entry.id !== id),
    );
    const tabs = readCalcTabs(key).filter((tab) => tab.id !== id);
    writeTabsRaw(key, tabs);
    if (readCalcActive(key) === id) {
      window.sessionStorage.setItem(activeKey(key), '');
    }
  } catch {
    return;
  }
  emitCalcStorage();
}

export function resolveCalcActive(
  tabs: readonly CalcTreeEntry[],
  raw: string | null,
): string | null {
  return (tabs.find((tab) => tab.id === raw) ?? tabs[0])?.id ?? null;
}

export function readCalcStorage(key: string): CalculatorState | null {
  const tabs = readCalcTabs(key);
  const active = resolveCalcActive(tabs, readCalcActive(key));
  return tabs.find((tab) => tab.id === active)?.state ?? null;
}

export function writeCalcStorage(
  key: string,
  state: CalculatorState,
): void {
  const tabs = readCalcTabs(key);
  const active = resolveCalcActive(tabs, readCalcActive(key));
  const index = tabs.findIndex((tab) => tab.id === active);
  if (index >= 0) {
    const next = tabs.slice();
    next[index] = { ...next[index]!, savedAt: Date.now(), state };
    writeCalcTabs(key, next, active);
    return;
  }
  const entry = newCalcEntry(state);
  writeCalcTabs(key, [...tabs, entry], entry.id);
}

const migrated = new Set<string>();

function mergeEntries(lists: CalcTreeEntry[][]): CalcTreeEntry[] {
  const byId = new Map<string, CalcTreeEntry>();
  for (const list of lists) {
    for (const entry of list) {
      const prev = byId.get(entry.id);
      if (!prev || (entry.savedAt ?? 0) > (prev.savedAt ?? 0)) {
        byId.set(entry.id, entry);
      }
    }
  }
  return [...byId.values()];
}

function legacyKeys(prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const name = window.localStorage.key(i);
    if (name && name.startsWith(prefix)) keys.push(name);
  }
  return keys;
}

export function migrateCalcStorage(key: string): void {
  if (typeof window === 'undefined' || migrated.has(key)) return;
  migrated.add(key);
  try {
    const tabKeys = legacyKeys(`${key}/`);
    const histKeys = legacyKeys(`${historyKey(key)}/`);
    if (!tabKeys.length && !histKeys.length) return;
    if (tabKeys.length) {
      const lists = [readCalcTabs(key)].filter((list) => list.length);
      for (const legacy of tabKeys) {
        const tabs = readCalcTabs(legacy);
        if (tabs.length) lists.push(tabs);
      }
      writeTabsRaw(key, mergeEntries(lists));
    }
    if (histKeys.length) {
      const lists = [readCalcHistory(key)].filter((list) => list.length);
      for (const legacy of histKeys) {
        const entries = readJSON(
          window.localStorage.getItem(legacy),
          isCalcHistory,
        );
        if (entries) {
          migrateEntries(entries);
          lists.push(entries);
        }
      }
      writeHistoryRaw(key, mergeEntries(lists));
    }
    for (const legacy of [...tabKeys, ...histKeys]) {
      window.localStorage.removeItem(legacy);
    }
    emitCalcStorage();
  } catch {
    return;
  }
}

export function subscribeCalcStorage(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CALC_STATE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(CALC_STATE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

