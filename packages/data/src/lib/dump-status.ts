export type DumpDatasetState = {
  status: 'ok' | 'failed';
  fails: number;
  lastFail: number;
};

export type DumpStatusSnapshot = {
  statuses: Record<string, DumpDatasetState>;
  retryNonce: number;
  dismissed: boolean;
};

type Store = {
  state: Map<string, DumpDatasetState>;
  listeners: Set<() => void>;
  retryNonce: number;
  dismissedSignature: string;
  snapshot: DumpStatusSnapshot;
};

const store = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.dump-status')
] ??= {
  state: new Map(),
  listeners: new Set(),
  retryNonce: 0,
  dismissedSignature: '',
  snapshot: { statuses: {}, retryNonce: 0, dismissed: false },
}) as Store;

function notify() {
  store.snapshot = {
    statuses: Object.fromEntries(store.state),
    retryNonce: store.retryNonce,
    dismissed: dumpFailuresDismissed(),
  };
  for (const listener of store.listeners) listener();
}

export function markDumpResult(id: string, ok: boolean) {
  const prev = store.state.get(id);
  if (ok) {
    if (!prev || prev.status === 'failed') {
      store.state.set(id, { status: 'ok', fails: 0, lastFail: 0 });
      if (prev?.status === 'failed') store.retryNonce += 1;
      notify();
    }
    return;
  }
  const fails = (prev?.fails ?? 0) + 1;
  store.state.set(id, { status: 'failed', fails, lastFail: Date.now() });
  notify();
}

export function dumpStatusSnapshot(): DumpStatusSnapshot {
  return store.snapshot;
}

export function subscribeDumpStatus(listener: () => void): () => void {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

export function requestDumpRetry() {
  store.retryNonce += 1;
  notify();
}

export function dumpRetryDelay(fails: number): number {
  return fails <= 1 ? 10_000 : fails === 2 ? 30_000 : 60_000;
}

export function dumpFailureSignature(): string {
  const failed = [...store.state.entries()].filter(
    ([, state]) => state.status === 'failed',
  );
  if (!failed.length) return '';
  const ids = failed.map(([id]) => id).sort().join(',');
  const fails = failed.reduce((sum, [, state]) => sum + state.fails, 0);
  return `${ids}#${fails}`;
}

export function dismissDumpFailures() {
  store.dismissedSignature = dumpFailureSignature();
  notify();
}

export function dumpFailuresDismissed(): boolean {
  const signature = dumpFailureSignature();
  return signature !== '' && signature === store.dismissedSignature;
}
