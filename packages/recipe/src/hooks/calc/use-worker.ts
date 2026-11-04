'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { proxy, wrap, type Remote } from 'comlink';
import type {
  CalcWorkerApi,
  CalcWorkerFlush,
} from '@terrafirmagreg-team/recipe/lib/calc/worker';
import { api as localCalcApi } from '@terrafirmagreg-team/recipe/lib/calc/worker/api';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import type { CalcMapsSlice } from './use-maps';

type CalcWorkerHandle = {
  worker: Worker | null;
  api: Remote<CalcWorkerApi>;
  inFlight: number;
  rejecters: Set<(error: Error) => void>;
};

export function useCalcWorker({
  dataset,
  catalog,
  activeTabId,
  applyMaps,
  resetMaps,
}: {
  dataset: DatasetRef;
  catalog: RecipeCompactIndex | null;
  activeTabId: string | null;
  applyMaps: (src: CalcMapsSlice, extra?: () => void) => void;
  resetMaps: () => void;
}) {
  const workerRef = useRef<CalcWorkerHandle | null>(null);
  const [workerState, setWorkerState] = useState<'pending' | 'ready'>(
    'pending',
  );
  const [generation, setGeneration] = useState(0);
  const [workerSettled, setWorkerSettled] = useState(false);
  const resolvedKeyRef = useRef<string | null>(null);

  const minFlushEpochRef = useRef(0);
  const [prevTab, setPrevTab] = useState(activeTabId);
  if (prevTab !== activeTabId) {
    setPrevTab(activeTabId);
    setWorkerSettled(false);
  }
  useEffect(() => {
    resolvedKeyRef.current = null;
    minFlushEpochRef.current += 1;
    const handle = workerRef.current;
    if (handle) void handle.api.invalidate().catch(() => {});
  }, [activeTabId]);

  const applyWorkerFlush = useCallback(
    (msg: CalcWorkerFlush) => {
      if (msg.epoch < minFlushEpochRef.current) return;
      applyMaps({
        out: new Map(msg.out),
        tag: new Map(msg.tag),
        recipes: new Map(msg.recipes),
        bodies: new Map(msg.bodies),
        dead: new Set(msg.dead),
      });
    },
    [applyMaps],
  );

  const bufferedFlush = useRef<CalcWorkerFlush | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainFlush = useCallback(() => {
    flushTimer.current = null;
    const msg = bufferedFlush.current;
    bufferedFlush.current = null;
    if (msg) applyWorkerFlush(msg);
  }, [applyWorkerFlush]);
  const scheduleWorkerFlush = useCallback(
    (msg: CalcWorkerFlush) => {
      const prev = bufferedFlush.current;
      bufferedFlush.current = prev
        ? {
            out: [...prev.out, ...msg.out],
            tag: [...prev.tag, ...msg.tag],
            recipes: [...prev.recipes, ...msg.recipes],
            bodies: [...prev.bodies, ...msg.bodies],
            dead: [...prev.dead, ...msg.dead],
            epoch: Math.max(prev.epoch, msg.epoch),
          }
        : msg;
      if (flushTimer.current) return;
      flushTimer.current = setTimeout(drainFlush, 350);
    },
    [drainFlush],
  );

  useEffect(() => {
    if (!catalog) return;
    const handle: CalcWorkerHandle = {
      worker: null,
      api: localCalcApi as Remote<CalcWorkerApi>,
      inFlight: 0,
      rejecters: new Set(),
    };
    const swapToLocal = () => {
      handle.worker = null;
      handle.api = localCalcApi as Remote<CalcWorkerApi>;
      const error = new Error('calc worker failed');
      for (const reject of handle.rejecters) reject(error);
      handle.rejecters.clear();
      bufferedFlush.current = null;
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      resolvedKeyRef.current = null;
      minFlushEpochRef.current = 0;
      setGeneration((g) => g + 1);
      void handle.api.init(dataset, catalog, scheduleWorkerFlush).catch(() => {});
    };
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker(
          new URL('../../lib/calc/worker/index.ts', import.meta.url),
          { type: 'module' },
        );
        worker.onerror = () => swapToLocal();
        handle.worker = worker;
        handle.api = wrap<CalcWorkerApi>(worker);
      } catch {
      }
    }
    handle.api
      .init(
        dataset,
        catalog,
        handle.worker ? proxy(scheduleWorkerFlush) : scheduleWorkerFlush,
      )
      .then(() => setWorkerState('ready'))
      .catch(() => {});
    workerRef.current = handle;
    resolvedKeyRef.current = null;
    minFlushEpochRef.current = 0;
    resetMaps();
    startTransition(() => setWorkerSettled(false));
    return () => {
      if (flushTimer.current) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
      bufferedFlush.current = null;
      workerRef.current = null;
      handle.worker?.terminate();
    };
  }, [dataset, catalog, scheduleWorkerFlush, resetMaps]);

  const call = useCallback(
    <T,>(fn: (api: Remote<CalcWorkerApi>) => Promise<T>): Promise<T> => {
      const handle = workerRef.current;
      if (!handle) {
        return Promise.reject(new Error('calc worker unavailable'));
      }
      handle.inFlight += 1;
      setWorkerSettled(false);
      return new Promise<T>((resolve, reject) => {
        handle.rejecters.add(reject);
        fn(handle.api)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            handle.rejecters.delete(reject);
            handle.inFlight -= 1;
            if (handle.inFlight === 0) {
              if (flushTimer.current) {
                clearTimeout(flushTimer.current);
                flushTimer.current = null;
              }
              drainFlush();
              setWorkerSettled(true);
            }
          });
      });
    },
    [drainFlush],
  );

  return {
    ref: workerRef,
    state: workerState,
    generation,
    settled: workerSettled,
    call,
    isResolved: useCallback((key: string) => resolvedKeyRef.current === key, []),
    markResolved: useCallback((key: string) => {
      resolvedKeyRef.current = key;
    }, []),
  };
}

