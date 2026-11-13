import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DatasetRef, DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import type { SectionDump } from './config';
import {
  createDatasetSnapshotStore,
  datasetSelectionKey,
  datasetSnapshotKey,
} from './dataset-snapshots';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const selection = { id: 'pack', version: '1.0' };
const first = { ...selection, revision: 'a' };
const second = { ...selection, revision: 'b' };
const manifest: SectionDump = { manifest: {}, mods: [] };

function setup() {
  const resolutions: DatasetRef[] = [];
  const preloads: DatasetRef[] = [];
  let resolveSnapshot: (ref: DatasetRef) => Promise<DatasetSnapshot> = async () => first;
  let loadDump: (ref: DatasetRef) => Promise<SectionDump | null> = async () => manifest;
  const store = createDatasetSnapshotStore({
    resolveSnapshot: (ref) => {
      resolutions.push(ref);
      return resolveSnapshot(ref);
    },
    loadDump: (ref) => {
      preloads.push(ref);
      return loadDump(ref);
    },
  });
  return {
    store, resolutions, preloads,
    resolver(fn: typeof resolveSnapshot) { resolveSnapshot = fn; },
    loader(fn: typeof loadDump) { loadDump = fn; },
  };
}

async function settle() {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

test('initial content is withheld until the snapshot resolves; failure permits retry', async () => {
  const env = setup();
  const request = deferred<DatasetSnapshot>();
  env.resolver(() => request.promise);
  const unsubscribe = env.store.subscribe(selection, () => {});
  assert.equal(env.store.get(selection).active, undefined);
  assert.equal(env.store.get(selection).pending, true);
  request.reject(new Error('offline'));
  await settle();
  assert.equal(env.store.get(selection).active, undefined);
  assert.equal(env.store.get(selection).pending, false);
  assert.ok(env.store.get(selection).error);
  env.resolver(async () => first);
  await env.store.retry(selection);
  assert.deepEqual(env.store.get(selection).active, first);
  unsubscribe();
});

test('two subscribers share a single resolution and a resubscribe re-checks once', async () => {
  const env = setup();
  const request = deferred<DatasetSnapshot>();
  env.resolver(() => request.promise);
  const unsubscribeA = env.store.subscribe(selection, () => {});
  const unsubscribeB = env.store.subscribe({ ...selection }, () => {});
  await settle();
  assert.equal(env.resolutions.length, 1);
  request.resolve(first);
  await settle();
  assert.equal(env.resolutions.length, 1);
  unsubscribeA();
  assert.equal(env.resolutions.length, 1);
  unsubscribeB();
  env.resolver(async () => second);
  const resubscribe = env.store.subscribe(selection, () => {});
  await settle();
  assert.equal(env.resolutions.length, 2);
  assert.deepEqual(env.store.get(selection).candidate, second);
  resubscribe();
});

test('language-only selection retains the immutable active snapshot', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  const active = env.store.get(selection).active;
  const translated = { ...selection, lang: 'ru_ru' };
  assert.equal(datasetSelectionKey(translated), datasetSelectionKey(selection));
  assert.equal(env.store.get(translated).active, active);
  assert.ok(Object.isFrozen(active));
  unsubscribe();
  const resubscribe = env.store.subscribe(translated, () => {});
  assert.equal(env.store.get(translated).active, active);
  resubscribe();
});

test('candidate retains readable active data; failed preload retries then atomically changes active and key', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async () => second);
  await env.store.retry(selection);
  const state = env.store.get(selection);
  assert.deepEqual(state.active, first);
  assert.deepEqual(state.candidate, second);
  const oldKey = datasetSnapshotKey(state.active!);
  env.loader(async () => null);
  await env.store.confirm(selection);
  assert.deepEqual(env.store.get(selection).active, first);
  assert.deepEqual(env.store.get(selection).candidate, second);
  assert.ok(env.store.get(selection).error);
  const request = deferred<SectionDump>();
  env.loader(() => request.promise);
  const pending = env.store.confirm(selection);
  const duplicate = env.store.confirm(selection);
  assert.equal(pending, duplicate);
  assert.equal(env.store.get(selection).confirming, true);
  assert.equal(datasetSnapshotKey(env.store.get(selection).active!), oldKey);
  request.resolve(manifest);
  await pending;
  const confirmed = env.store.get(selection);
  assert.deepEqual(confirmed.active, second);
  assert.equal(confirmed.candidate, undefined);
  assert.equal(confirmed.error, undefined);
  assert.notEqual(datasetSnapshotKey(confirmed.active!), oldKey);
  assert.deepEqual(env.preloads, [second, second]);
  unsubscribe();
});

test('background resolution failure retains active data without exposing a broken-dataset error', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async () => { throw new Error('offline'); });
  await env.store.retry(selection);
  assert.deepEqual(env.store.get(selection).active, first);
  assert.equal(env.store.get(selection).error, undefined);
  unsubscribe();
});

test('pending resolution after navigation is ignored and a new selection never displays old active data', async () => {
  const env = setup();
  const request = deferred<DatasetSnapshot>();
  env.resolver(() => request.promise);
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  unsubscribe();
  const next = { id: selection.id, version: '2.0' };
  env.resolver(async (ref) => ({ ...ref, version: '2.0', revision: 'c' }));
  const unsubscribeNext = env.store.subscribe(next, () => {});
  assert.equal(env.store.get(next).active, undefined);
  request.resolve(first);
  await settle();
  assert.equal(env.store.get(selection).active, undefined);
  assert.equal(env.store.get(next).active?.version, '2.0');
  unsubscribeNext();
});

test('pending confirmation after unsubscribe cannot publish its snapshot', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async () => second);
  await env.store.retry(selection);
  const request = deferred<SectionDump>();
  env.loader(() => request.promise);
  const pending = env.store.confirm(selection);
  unsubscribe();
  request.resolve(manifest);
  await pending;
  assert.deepEqual(env.store.get(selection).active, first);
  assert.equal(env.store.get(selection).confirming, false);
});

test('re-checks keep the exact selected version, including an explicit latest version', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async (ref) => ({ id: ref.id, version: '2.0', revision: 'c' }));
  await env.store.retry(selection);
  assert.deepEqual(env.resolutions, [selection, selection]);
  assert.deepEqual(env.store.get(selection).active, first);
  assert.equal(env.store.get(selection).candidate, undefined);
  unsubscribe();
});

test('a late background check cannot restore a candidate after confirmation', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async () => second);
  await env.store.retry(selection);
  const check = deferred<DatasetSnapshot>();
  env.resolver(() => check.promise);
  const refreshing = env.store.retry(selection);
  await settle();
  await env.store.confirm(selection);
  check.resolve({ ...selection, revision: 'older-check' });
  await refreshing;
  assert.deepEqual(env.store.get(selection).active, second);
  assert.equal(env.store.get(selection).candidate, undefined);
  unsubscribe();
});

test('an unversioned selection discovers a new latest version as a candidate without swapping active', async () => {
  const env = setup();
  const bare = { id: selection.id };
  const unsubscribe = env.store.subscribe(bare, () => {});
  await settle();
  const latest = { ...first, version: '2.0', revision: 'c' };
  env.resolver(async () => latest);
  await env.store.retry(bare);
  assert.deepEqual(env.resolutions, [
    { ...bare, version: undefined },
    { ...bare, version: undefined },
  ]);
  assert.deepEqual(env.store.get(bare).active, first);
  assert.deepEqual(env.store.get(bare).candidate, latest);
  unsubscribe();
});

test('publisher rollback clears the obsolete candidate and its preload error while keeping active stable', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  const active = env.store.get(selection).active;
  env.resolver(async () => second);
  await env.store.retry(selection);
  env.loader(async () => null);
  await env.store.confirm(selection);
  assert.deepEqual(env.store.get(selection).candidate, second);
  assert.ok(env.store.get(selection).error);
  env.resolver(async () => first);
  await env.store.retry(selection);
  const state = env.store.get(selection);
  assert.equal(state.active, active);
  assert.equal(state.candidate, undefined);
  assert.equal(state.error, undefined);
  unsubscribe();
});

test('LRU retains twelve inactive selections and never evicts subscribers or passive watchers', async () => {
  const env = setup();
  env.resolver(async (ref) => ({ ...ref, version: ref.version!, revision: 'a' }));
  const live = { id: 'live', version: '1.0' };
  const watched = { id: 'watched', version: '1.0' };
  const unsubscribeLive = env.store.subscribe(live, () => {});
  const unsubscribeWatched = env.store.subscribe(watched, () => {});
  await settle();
  const liveState = env.store.get(live);
  const watchedState = env.store.get(watched);
  const unwatch = env.store.watch(watched, () => {});
  unsubscribeWatched();
  const inactive: DatasetRef[] = [];
  for (let index = 0; index < 20; index++) {
    const ref = { id: `inactive-${index}`, version: '1.0' };
    const unsubscribe = env.store.subscribe(ref, () => {});
    await settle();
    unsubscribe();
    inactive.push(ref);
  }
  for (const ref of inactive.slice(-12)) {
    assert.ok(env.store.get(ref).active);
  }
  assert.equal(env.store.get(live), liveState);
  assert.equal(env.store.get(watched), watchedState);
  for (const ref of inactive.slice(0, -12)) {
    assert.equal(env.store.get(ref).active, undefined);
    assert.equal(env.store.get(ref).candidate, undefined);
  }
  unsubscribeLive();
  unwatch();
});

test('LRU reads promote an inactive selection and eviction drops stale candidates', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async () => second);
  await env.store.retry(selection);
  unsubscribe();
  env.resolver(async (ref) => ({ ...ref, version: ref.version!, revision: 'c' }));
  const refs = Array.from({ length: 12 }, (_, index) => ({
    id: `other-${index}`, version: '1.0',
  }));
  for (const ref of refs.slice(0, 11)) {
    const stop = env.store.subscribe(ref, () => {});
    await settle();
    stop();
  }
  const retained = env.store.get(selection);
  assert.deepEqual(retained.candidate, second);
  const stop = env.store.subscribe(refs[11], () => {});
  await settle();
  stop();
  assert.equal(env.store.get(selection), retained);
  assert.equal(env.store.get(refs[0]).active, undefined);
  for (let index = 0; index < 12; index++) {
    env.store.get({ id: `read-${index}` });
  }
  const evicted = env.store.get(selection);
  assert.equal(evicted.active, undefined);
  assert.equal(evicted.candidate, undefined);
});

test('a re-check that re-detects the candidate clears a stale preload error so the boundary may retry', async () => {
  const env = setup();
  const unsubscribe = env.store.subscribe(selection, () => {});
  await settle();
  env.resolver(async () => second);
  await env.store.retry(selection);
  env.loader(async () => null);
  await env.store.confirm(selection);
  assert.deepEqual(env.store.get(selection).candidate, second);
  assert.ok(env.store.get(selection).error);
  await env.store.retry(selection);
  const state = env.store.get(selection);
  assert.deepEqual(state.candidate, second);
  assert.equal(state.error, undefined);
  unsubscribe();
});
