import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
export const CALC_STATE_EVENT = 'tfg:calc-state';
const TAB_KEY = 'tfg:calc-tab';
const ACTIVE_PREFIX = 'calc:active:';
const HIST_PREFIX = 'calc:hist:';

let tabId: string | null = null;

function calcTabId(): string {
  if (tabId) return tabId;
  try {
    tabId = window.sessionStorage.getItem(TAB_KEY);
    if (!tabId) {
      tabId = crypto.randomUUID();
      window.sessionStorage.setItem(TAB_KEY, tabId);
    }
  } catch {
    tabId ??= `tab-${crypto.randomUUID()}`;
  }
  return tabId;
}

export function calcStorageKey(section: string, dataset: DatasetRef): string {
  void calcTabId();
  return `calc:tabs:${section}:${dataset.id}`;
}

export function activeKey(key: string): string {
  return `${ACTIVE_PREFIX}${key}@${calcTabId()}`;
}

export function historyKey(key: string): string {
  return `${HIST_PREFIX}${key}`;
}

export const emitCalcStorage = () =>
  window.dispatchEvent(new Event(CALC_STATE_EVENT));

