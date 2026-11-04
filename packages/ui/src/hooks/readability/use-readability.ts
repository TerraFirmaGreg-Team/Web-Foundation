'use client';
import { useMediaQuery } from '@terrafirmagreg-team/ui/hooks/use-media-query';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  applyState,
  clampWidth,
  clearState,
  getServerSnapshot,
  readState,
  subscribe,
  writeState,
} from '@terrafirmagreg-team/ui/lib/readability/store';
import type {
  ReadabilityLayout,
  ReadabilityValue,
  SpotlightStyle,
} from '@terrafirmagreg-team/ui/types/readability';

const ReadabilityContext = createContext<ReadabilityValue | null>(null);

export function useReadability(): ReadabilityValue {
  const context = useContext(ReadabilityContext);
  if (!context) throw new Error('Missing ReadabilityProvider');
  return context;
}

export function ReadabilityProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, readState, getServerSnapshot);
  const coarsePointer = useMediaQuery('(pointer: coarse)') === true;
  const smallScreen = useMediaQuery('(min-width: 768px)') !== true;

  useLayoutEffect(() => {
    applyState(state);
  }, [state]);
  useLayoutEffect(() => clearState, []);

  const setLayout = useCallback((layout: ReadabilityLayout) => {
    writeState({ layout });
  }, []);
  const setPageWidth = useCallback((pageWidth: number) => {
    writeState({ pageWidth: clampWidth(pageWidth, 100) });
  }, []);
  const setContentWidth = useCallback((contentWidth: number) => {
    writeState({ contentWidth: clampWidth(contentWidth, 100) });
  }, []);
  const setSpotlight = useCallback((spotlight: boolean) => {
    writeState({ spotlight });
  }, []);
  const setSpotlightStyle = useCallback((spotlightStyle: SpotlightStyle) => {
    writeState({ spotlightStyle });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      coarsePointer,
      smallScreen,
      setLayout,
      setPageWidth,
      setContentWidth,
      setSpotlight,
      setSpotlightStyle,
    }),
    [
      state,
      coarsePointer,
      smallScreen,
      setLayout,
      setPageWidth,
      setContentWidth,
      setSpotlight,
      setSpotlightStyle,
    ],
  );

  return createElement(ReadabilityContext.Provider, { value }, children);
}

