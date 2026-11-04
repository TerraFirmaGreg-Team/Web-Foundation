'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  newCalcEntry,
  readCalcActive,
  resolveCalcActive,
  readCalcHistory,
  readCalcStorage,
  readCalcTabs,
  removeCalcHistory,
  subscribeCalcStorage,
  updateCalcTab,
  writeCalcActive,
  writeCalcStorage,
  writeCalcTabs,
  type CalcTreeEntry,
} from '@terrafirmagreg-team/recipe/lib/calc/storage';
import type { CalculatorState } from '@terrafirmagreg-team/recipe/types/calc';

const EMPTY_TABS: CalcTreeEntry[] = [];
const EMPTY_CALC: CalculatorState = {
  cards: [],
  wires: [],
  tagSelections: {},
};

export function useCalcStorage(storageKey: string) {
  const readSnapshot = useCallback(
    () => readCalcStorage(storageKey),
    [storageKey],
  );
  const calcState = useSyncExternalStore(
    subscribeCalcStorage,
    readSnapshot,
    () => null,
  );
  const tabs = useSyncExternalStore(
    subscribeCalcStorage,
    () => readCalcTabs(storageKey),
    () => EMPTY_TABS,
  );
  const activeTabId = useSyncExternalStore(
    subscribeCalcStorage,
    () => resolveCalcActive(readCalcTabs(storageKey), readCalcActive(storageKey)),
    () => null,
  );
  const history = useSyncExternalStore(
    subscribeCalcStorage,
    () => readCalcHistory(storageKey),
    () => EMPTY_TABS,
  );

  const persist = useCallback(
    (next: CalculatorState) => {
      writeCalcStorage(storageKey, next);
    },
    [storageKey],
  );

  const openTab = useCallback(
    (id: string | null) => writeCalcActive(storageKey, id),
    [storageKey],
  );

  const openEntry = useCallback(
    (entry: CalcTreeEntry) => {
      const list = readCalcTabs(storageKey);
      const existing = list.find((tab) => tab.id === entry.id);
      writeCalcTabs(
        storageKey,
        existing ? list : [...list, entry],
        entry.id,
      );
    },
    [storageKey],
  );
  const closeTab = useCallback(
    (id: string) => {
      const list = readCalcTabs(storageKey).filter((tab) => tab.id !== id);
      const active =
        readCalcActive(storageKey) === id ? null : readCalcActive(storageKey);
      writeCalcTabs(storageKey, list, active);
    },
    [storageKey],
  );
  const newTab = useCallback(() => {
    const entry = newCalcEntry({ ...EMPTY_CALC });
    writeCalcTabs(storageKey, [...readCalcTabs(storageKey), entry], entry.id);
  }, [storageKey]);
  const renameTab = useCallback(
    (id: string, name: string) => {
      updateCalcTab(storageKey, id, (tab) => ({
        ...tab,
        name: name.trim() || undefined,
      }));
    },
    [storageKey],
  );
  const setTabIcon = useCallback(
    (id: string, icon: CalcTreeEntry['icon']) => {
      updateCalcTab(storageKey, id, (tab) => ({ ...tab, icon }));
    },
    [storageKey],
  );
  const removeHistory = useCallback(
    (id: string) => removeCalcHistory(storageKey, id),
    [storageKey],
  );

  return {
    calcState,
    tabs,
    activeTabId,
    history,
    persist,
    openTab,
    openEntry,
    closeTab,
    newTab,
    renameTab,
    setTabIcon,
    removeHistory,
  };
}

