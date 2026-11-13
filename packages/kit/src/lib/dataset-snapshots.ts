import type { DatasetRef, DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import { clientDumpLoader, type ClientDumpLoader } from '@terrafirmagreg-team/kit/lib/config';
import type { DatasetSnapshotState } from '@terrafirmagreg-team/kit/types/dataset-snapshots';

type Entry = {
  selection: DatasetRef;
  state: DatasetSnapshotState;
  listeners: Set<() => void>;
  subscribers: number;
  generation: number;
  refresh?: Promise<void>;
  confirmation?: Promise<void>;
};

const initialState: DatasetSnapshotState = Object.freeze({
  pending: true,
  confirming: false,
});

const MAX_INACTIVE_SELECTIONS = 12;

export function datasetSelectionKey(dataset: DatasetRef): string {
  return JSON.stringify([dataset.id, dataset.version ?? null]);
}

export function datasetSnapshotKey(dataset: DatasetSnapshot): string {
  return `${dataset.id}/${dataset.version}/${dataset.revision}`;
}

export function createDatasetSnapshotStore(
  loader: Pick<ClientDumpLoader, 'resolveSnapshot' | 'loadDump'>,
) {
  const entries = new Map<string, Entry>();

  function pruneInactive() {
    const inactive = [...entries].filter(([, entry]) =>
      !entry.subscribers && !entry.listeners.size,
    );
    for (const [key, entry] of inactive.slice(0, -MAX_INACTIVE_SELECTIONS)) {
      entry.generation++;
      entries.delete(key);
    }
  }

  function touch(entry: Entry) {
    const key = datasetSelectionKey(entry.selection);
    entries.delete(key);
    entries.set(key, entry);
    pruneInactive();
  }

  function entryFor(selection: DatasetRef): Entry {
    const key = datasetSelectionKey(selection);
    let entry = entries.get(key);
    if (!entry) {
      entry = {
        selection: { id: selection.id, version: selection.version },
        state: initialState,
        listeners: new Set(),
        subscribers: 0,
        generation: 0,
      };
    }
    touch(entry);
    return entry;
  }

  function update(entry: Entry, state: DatasetSnapshotState) {
    entry.state = Object.freeze(state);
    for (const listener of entry.listeners) listener();
  }

  function refresh(entry: Entry): Promise<void> {
    if (entry.refresh) return entry.refresh;
    if (entry.state.confirming || !entry.subscribers) return Promise.resolve();
    const generation = entry.generation;
    const selection = entry.selection;
    if (!entry.state.active) {
      update(entry, { ...entry.state, pending: true, error: undefined });
    }
    const current = () =>
      entry.subscribers > 0 && entry.generation === generation;
    const promise = Promise.resolve()
      .then(() => loader.resolveSnapshot(selection))
      .then((resolved) => {
        if (!current()) return;
        if (
          resolved.id !== selection.id ||
          (selection.version !== undefined && resolved.version !== selection.version) ||
          !resolved.version ||
          !resolved.revision
        ) {
          throw new Error('Invalid dataset snapshot');
        }
        const snapshot = Object.freeze({ ...resolved });
        if (!entry.state.active) {
          update(entry, {
            active: snapshot,
            pending: false,
            confirming: false,
          });
        } else if (datasetSnapshotKey(snapshot) !== datasetSnapshotKey(entry.state.active)) {
          update(entry, { ...entry.state, candidate: snapshot, error: undefined });
        } else if (entry.state.candidate || entry.state.error !== undefined) {
          update(entry, { ...entry.state, candidate: undefined, error: undefined });
        }
      })
      .catch((error: unknown) => {
        if (current() && !entry.state.active) {
          update(entry, { pending: false, confirming: false, error });
        }
      })
      .finally(() => {
        if (entry.refresh === promise) entry.refresh = undefined;
      });
    entry.refresh = promise;
    return promise;
  }

  function confirm(entry: Entry): Promise<void> {
    if (entry.confirmation) return entry.confirmation;
    const candidate = entry.state.candidate;
    if (!candidate || !entry.subscribers) return Promise.resolve();
    const generation = ++entry.generation;
    update(entry, { ...entry.state, confirming: true, error: undefined });
    const promise = Promise.resolve()
      .then(() => loader.loadDump(candidate))
      .then((dump) => {
        if (!dump?.manifest) throw new Error('Dataset manifest is unavailable');
        if (!entry.subscribers || entry.generation !== generation) return;
        update(entry, {
          active: candidate,
          pending: false,
          confirming: false,
        });
      })
      .catch((error: unknown) => {
        if (entry.subscribers && entry.generation === generation) {
          update(entry, { ...entry.state, confirming: false, error });
        }
      })
      .finally(() => {
        if (entry.confirmation === promise) entry.confirmation = undefined;
      });
    entry.confirmation = promise;
    return promise;
  }

  return {
    get(selection: DatasetRef): DatasetSnapshotState {
      return entryFor(selection).state;
    },
    watch(selection: DatasetRef, listener: () => void) {
      const entry = entryFor(selection);
      entry.listeners.add(listener);
      return () => {
        entry.listeners.delete(listener);
        touch(entry);
      };
    },
    subscribe(selection: DatasetRef, listener: () => void) {
      const entry = entryFor(selection);
      entry.listeners.add(listener);
      entry.subscribers++;
      if (entry.subscribers === 1) {
        void refresh(entry);
      }
      return () => {
        entry.listeners.delete(listener);
        entry.subscribers--;
        if (entry.subscribers) return;
        entry.generation++;
        entry.refresh = undefined;
        entry.confirmation = undefined;
        if (entry.state.confirming || entry.state.pending) {
          update(entry, { ...entry.state, confirming: false, pending: !entry.state.active });
        }
        touch(entry);
      };
    },
    retry(selection: DatasetRef) {
      return refresh(entryFor(selection));
    },
    confirm(selection: DatasetRef) {
      return confirm(entryFor(selection));
    },
  };
}

export const datasetSnapshots = createDatasetSnapshotStore({
  resolveSnapshot: (selection) => clientDumpLoader().resolveSnapshot(selection),
  loadDump: (snapshot) => clientDumpLoader().loadDump(snapshot),
});

export function serverDatasetSnapshot(): DatasetSnapshotState {
  return initialState;
}
