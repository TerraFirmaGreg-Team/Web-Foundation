'use client';

import {
  useCallback,
  useState,
  useSyncExternalStore,
} from 'react';

const INTERVAL_MS = 4000;
const TICK_MS = 250;

const listeners = new Set<() => void>();
let timer: number | undefined;
let ticks = 0;

function subscribeTick(listener: () => void) {
  listeners.add(listener);
  timer ??= window.setInterval(() => {
    ticks += 1;
    for (const listener of listeners) listener();
  }, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

const readTickServer = () => 0;

export function useCycleIndex(
  length: number,
  {
    enabled = true,
    paused = false,
    intervalMs = INTERVAL_MS,
  }: { enabled?: boolean; paused?: boolean; intervalMs?: number } = {},
) {
  const running = enabled && !paused && length > 1;
  const interval = intervalMs > 0 ? intervalMs : INTERVAL_MS;
  const span = Math.max(1, Math.round(interval / TICK_MS));
  const [offset, setOffset] = useState(0);

  const subscribe = useCallback(
    (listener: () => void) =>
      running ? subscribeTick(listener) : () => {},
    [running],
  );
  const readStep = useCallback(
    () => Math.floor(ticks / span),
    [span],
  );
  const base = useSyncExternalStore(
    subscribe,
    readStep,
    readTickServer,
  );
  const index =
    length > 0
      ? (((base + offset) % length) + length) % length
      : 0;

  const setIndex = useCallback(
    (next: number | ((current: number) => number)) => {
      const size = Math.max(length, 1);
      const target = typeof next === 'function' ? next(index) : next;
      setOffset((((target - base) % size) + size) % size);
    },
    [index, base, length],
  );

  return [index, setIndex] as const;
}

