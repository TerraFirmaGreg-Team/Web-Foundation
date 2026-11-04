'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

type EntryContextValue = {
  dataset: DatasetRef;
  lang?: Lang;
  langMap?: Record<string, string>;
};

const EntryContext = createContext<EntryContextValue | null>(null);

export function EntryProvider({
  dataset,
  lang,
  langMap,
  children,
}: EntryContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ dataset, lang, langMap }),
    [dataset, lang, langMap],
  );
  return createElement(EntryContext.Provider, { value }, children);
}

export function useEntryContext(): EntryContextValue | null {
  return useContext(EntryContext);
}

