import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { registerServerCache } from '@terrafirmagreg-team/data/lib/server-cache';
import { datasetCacheKey, type DatasetRef, type DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import { createDatasetCache, dumpReader } from './reader';
import { JsonDumpReader } from './json-reader';
import { dumpLocation, dumpPublicUrl, registerDumpLocation } from './paths';
import { loadClientVersions } from './client/dump';
import {
  DUMP_POINTER_TTL,
  loadDatasetVersions,
  parseDatasetVersions,
  parseSnapshotIndex,
  resolveDatasetSnapshot,
  snapshotRoot,
} from './snapshot';
import type { ArtifactDescriptor, DatasetVersions, SnapshotIndex } from '../../types/snapshot';

const a = 'a'.repeat(64);
const b = 'b'.repeat(64);
process.env.NEXT_PUBLIC_DUMP_STORAGE_URL = 'https://dump.invalid';

function snapshot(id: string, revision = a): DatasetSnapshot {
  return { id, version: '1.0', revision };
}

function pointer(id: string, revision = a): DatasetVersions {
  return {
    pack: id,
    latest: '1.0',
    versions: ['1.0'],
    snapshots: {
      '1.0': {
        revision,
        publishedAt: '2026-01-01T00:00:00Z',
        index: `${snapshotRoot(snapshot(id, revision))}/objects.json.gz`,
      },
    },
  };
}

function descriptor(codec: ArtifactDescriptor['codec'] = 'json', compression: ArtifactDescriptor['compression'] = 'none'): ArtifactDescriptor {
  return { sha256: a, bytes: 10, codec, compression };
}

function index(ref: DatasetSnapshot): SnapshotIndex {
  return {
    files: { 'table.ndjson': `${snapshotRoot(ref)}/table.payload` },
    artifacts: { 'table.ndjson': descriptor() },
  };
}

function compressed(value: unknown): Response {
  return new Response(new Uint8Array(gzipSync(JSON.stringify(value))));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test('strict boundary parsers reject missing fields, unsafe paths and mismatched identities', () => {
  const valid = pointer('parse');
  assert.deepEqual(parseDatasetVersions(valid, 'parse').versions, ['1.0']);
  for (const field of ['pack', 'latest', 'versions', 'snapshots']) {
    const bad = { ...valid } as Record<string, unknown>;
    delete bad[field];
    assert.throws(() => parseDatasetVersions(bad, 'parse'));
  }
  assert.throws(() => parseDatasetVersions(valid, 'other'));
  for (const change of [
    { revision: 'A'.repeat(64) },
    { publishedAt: 'yesterday' },
    { index: 'parse/1.0/objects.json.gz' },
  ]) {
    assert.throws(() => parseDatasetVersions({
      ...valid, snapshots: { '1.0': { ...valid.snapshots['1.0'], ...change } },
    }, 'parse'));
  }
  assert.throws(() => parseDatasetVersions({ ...valid, snapshots: {} }, 'parse'));
  assert.throws(() => parseDatasetVersions({ ...valid, latest: '2' }, 'parse'));
  for (const path of ['', '../file', '/file', 'a//b', 'a/./b', 'a\\b', 'a%2fb', 'a?b']) {
    assert.throws(() => parseSnapshotIndex({ files: { [path]: 'safe' }, artifacts: { [path]: descriptor() } }));
    assert.throws(() => parseSnapshotIndex({ files: { safe: path }, artifacts: { safe: descriptor() } }));
  }
  const validIndex = index(snapshot('parse'));
  assert.deepEqual(Object.keys(parseSnapshotIndex(validIndex).files), ['table.ndjson']);
  for (const field of ['sha256', 'bytes', 'codec', 'compression']) {
    const bad = { ...descriptor() } as Record<string, unknown>;
    delete bad[field];
    assert.throws(() => parseSnapshotIndex({ files: { x: 'safe' }, artifacts: { x: bad } }));
  }
  for (const change of [{ codec: 'xml' }, { compression: 'br' }, { bytes: -1 }, { sha256: 'no' }]) {
    assert.throws(() => parseSnapshotIndex({ files: { x: 'safe' }, artifacts: { x: { ...descriptor(), ...change } } }));
  }
  assert.throws(() => parseSnapshotIndex({ files: { x: 'safe' } }));
  assert.throws(() => parseSnapshotIndex({ artifacts: {} }));
});

test('one shared pointer cache refreshes selected versions; pinned snapshots bypass it', async (t) => {
  let now = 1000;
  let revision = a;
  let requests = 0;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    requests++;
    assert.equal(init.cache, 'no-cache');
    assert.ok(init.signal);
    return Response.json(pointer('refresh', revision));
  });
  assert.equal(loadClientVersions, loadDatasetVersions);
  const selected = { id: 'refresh', version: '1.0' };
  const old = await resolveDatasetSnapshot(selected);
  assert.equal(old.revision, a);
  revision = b;
  assert.deepEqual(await resolveDatasetSnapshot(selected), old);
  await loadClientVersions('refresh');
  assert.equal(requests, 1);
  now += DUMP_POINTER_TTL + 1;
  assert.equal((await resolveDatasetSnapshot(selected)).revision, b);
  assert.equal((await resolveDatasetSnapshot({ id: 'refresh' })).revision, b);
  assert.deepEqual(await resolveDatasetSnapshot(old), old);
  assert.equal(requests, 2);
  await assert.rejects(resolveDatasetSnapshot({ id: 'refresh', version: 'unknown' }), /Unknown/);
  await assert.rejects(resolveDatasetSnapshot({ id: 'refresh', revision: a }), /requires a version/);
});

test('all dataset cache layers, custom keys and peek isolate revisions and deduplicate', async (t) => {
  let now = 1000;
  let revision = a;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async () => Response.json(pointer('cache', revision)));
  let innerCalls = 0;
  let outerCalls = 0;
  const inner = createDatasetCache(async (ref: DatasetRef, part: string) => {
    innerCalls++;
    return datasetCacheKey(ref, part);
  }, (_ref, part) => part);
  const outer = createDatasetCache(async (ref: DatasetRef, part: string) => {
    outerCalls++;
    return inner(ref, part);
  }, () => 'constant');
  const ref = { id: 'cache', version: '1.0' };
  assert.equal(outer.peek(ref, 'x'), undefined);
  const [first, same] = await Promise.all([outer(ref, 'x'), outer(ref, 'x')]);
  assert.equal(first, same);
  assert.equal(outer.peek(ref, 'x'), first);
  assert.equal(innerCalls, 1);
  assert.equal(outerCalls, 1);
  revision = b;
  now += DUMP_POINTER_TTL + 1;
  assert.equal(outer.peek(ref, 'x'), undefined);
  const second = await outer(ref, 'x');
  assert.notEqual(second, first);
  assert.equal(outer.peek(ref, 'x'), second);
  assert.equal(outer.peek(snapshot('cache'), 'x'), first);
  assert.equal(inner.peek(snapshot('cache', b), 'x'), second);
  assert.equal(innerCalls, 2);
  assert.equal(outerCalls, 2);
});

test('old in-flight work cannot overwrite new snapshot cache or location', async (t) => {
  let now = 1000;
  let revision = a;
  const gate = deferred<Response>();
  const started = deferred<void>();
  t.mock.method(Date, 'now', () => now);
  const paths: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input);
    paths.push(url);
    if (url.endsWith('/versions.json')) return Response.json(pointer('flight', revision));
    if (url === `https://dump.invalid/${snapshotRoot(snapshot('flight'))}/objects.json.gz`) {
      started.resolve();
      return gate.promise;
    }
    if (url.endsWith('/objects.json.gz')) return compressed(index(snapshot('flight', b)));
    return Response.json({ revision: url.includes(b) ? b : a });
  });
  const selected = { id: 'flight', version: '1.0' };
  const oldReader = await dumpReader(selected);
  const pending = oldReader.getJson('table.ndjson');
  await started.promise;
  now += DUMP_POINTER_TTL + 1;
  revision = b;
  const newReader = await dumpReader(selected);
  assert.notEqual(newReader, oldReader);
  assert.deepEqual(await newReader.getJson('table.ndjson'), { revision: b });
  gate.resolve(compressed(index(snapshot('flight'))));
  assert.deepEqual(await pending, { revision: a });
  assert.equal(dumpReader.peek(selected), newReader);
  assert.equal(dumpLocation(snapshot('flight'))?.root, snapshotRoot(snapshot('flight')));
  assert.equal(dumpLocation(snapshot('flight', b))?.root, snapshotRoot(snapshot('flight', b)));
  assert.equal(dumpLocation(selected), undefined);
  assert.deepEqual(await oldReader.getJson('table.ndjson'), { revision: a });
  assert.equal(dumpPublicUrl(snapshot('flight'), 'missing.json'), undefined);
  assert.ok(paths.every((url) => url.endsWith('/versions.json') || url.includes('/revisions/')));
});

test('readers freeze one snapshot while server caches never freeze mutable selections', async (t) => {
  const symbol = Symbol.for('terrafirmagreg.serverCache');
  const store = globalThis as Record<symbol, unknown>;
  const previous = store[symbol];
  t.after(() => { store[symbol] = previous; });
  const persisted = new Map<string, unknown>();
  registerServerCache(async (key, loader, ttl) => {
    assert.equal(ttl, false);
    if (!persisted.has(key)) persisted.set(key, await loader());
    return persisted.get(key);
  });
  let now = 1000;
  let revision = a;
  let pointers = 0;
  t.mock.method(Date, 'now', () => now);
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith('/versions.json')) {
      pointers++;
      return Response.json(pointer('server', revision));
    }
    const rev = url.includes(b) ? b : a;
    if (url.endsWith('/objects.json.gz')) return compressed(index(snapshot('server', rev)));
    return Response.json({ revision: rev });
  });
  const reader = new JsonDumpReader({ id: 'server', version: '1.0' });
  assert.deepEqual(await reader.getJson('table.ndjson'), { revision: a });
  revision = b;
  now += DUMP_POINTER_TTL + 1;
  assert.deepEqual(await reader.getJson('table.ndjson'), { revision: a });
  const next = new JsonDumpReader({ id: 'server', version: '1.0' });
  assert.deepEqual(await next.getJson('table.ndjson'), { revision: b });
  assert.equal(pointers, 2);
  assert.ok([...persisted.keys()].every((key) => key.includes('/revisions/')));
  assert.equal(persisted.size, 4);
});

test('descriptor codecs produce identical maps; compression never depends on suffix', async (t) => {
  const ref = snapshot('codecs');
  const root = snapshotRoot(ref);
  const entries = { one: { n: 1 }, two: { n: 2 } };
  const files = {
    'plain.ndjson': `${root}/plain.gz`,
    'gzip.ndjson': `${root}/gzip.payload`,
    'json.ndjson': `${root}/json.payload`,
    'names/en_us.ndjson': `${root}/names.payload`,
    'binary.json': `${root}/binary.json`,
  };
  const artifacts = {
    'plain.ndjson': descriptor('ndjson'),
    'gzip.ndjson': descriptor('ndjson', 'gzip'),
    'json.ndjson': descriptor('json', 'gzip'),
    'names/en_us.ndjson': descriptor(),
    'binary.json': descriptor('binary'),
  };
  const ndjson = Object.entries(entries).map(([key, value]) => JSON.stringify({ [key]: value })).join('\n');
  const paths: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const path = String(input).replace('https://dump.invalid/', '');
    paths.push(path);
    if (path === `${root}/objects.json.gz`) return compressed({ files, artifacts });
    if (path === files['plain.ndjson']) return new Response(ndjson);
    if (path === files['gzip.ndjson']) return new Response(new Uint8Array(gzipSync(ndjson)));
    if (path === files['json.ndjson']) return compressed(entries);
    if (path === files['names/en_us.ndjson']) return Response.json({ 'mod:item{b:1,a:2}': 'Exact' });
    throw new Error(`Unexpected request: ${path}`);
  });
  const reader = new JsonDumpReader(ref);
  for (const path of ['plain.ndjson', 'gzip.ndjson', 'json.ndjson']) {
    assert.deepEqual(await reader.getJson(path), entries);
    const rows: [string, unknown][] = [];
    for await (const batch of reader.ndjsonRows(path)) rows.push(...batch);
    assert.deepEqual(Object.fromEntries(rows), entries);
  }
  assert.deepEqual(await reader.getNames('en_us'), { 'mod:item{b:1,a:2}': 'Exact' });
  await assert.rejects(reader.getJson('binary.json'), /Binary/);
  assert.equal(await reader.getJson('absent.ndjson'), undefined);
  assert.ok(!paths.some((path) => path.endsWith('/versions.json') || path.endsWith('/binary.json')));
  assert.throws(() => registerDumpLocation({ id: ref.id }, { root }), /requires a snapshot/);
});

test('missing pointers, transport failures and corrupt data reject explicitly and retry', async (t) => {
  let status = 503;
  let body: unknown = {};
  t.mock.method(globalThis, 'fetch', async () => Response.json(body, { status }));
  await assert.rejects(loadDatasetVersions('failure'), /fetch failed/);
  status = 200;
  await assert.rejects(loadDatasetVersions('failure'), /pack mismatch/);
  body = pointer('failure');
  assert.equal((await loadDatasetVersions('failure'))?.pack, 'failure');
  status = 404;
  assert.equal(await loadDatasetVersions('missing'), null);
  await assert.rejects(resolveDatasetSnapshot({ id: 'missing' }), /pointer missing/);
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('network'); });
  await assert.rejects(loadDatasetVersions('transport'), /network/);
});

test('failed loaders and invalid indexes are evicted, with no fallback HTTP requests', async (t) => {
  let attempts = 0;
  const cache = createDatasetCache(async () => {
    if (++attempts === 1) throw new Error('temporary');
    return 'ok';
  });
  const ref = snapshot('retry');
  await assert.rejects(cache(ref), /temporary/);
  assert.equal(cache.peek(ref), undefined);
  assert.equal(await cache(ref), 'ok');
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init: RequestInit) => {
    requests++;
    assert.equal(init.method, undefined);
    assert.equal(String(input), `https://dump.invalid/${snapshotRoot(ref)}/objects.json.gz`);
    if (requests === 1) return compressed({ files: {} });
    return compressed({ files: {}, artifacts: {} });
  });
  const reader = new JsonDumpReader(ref);
  await assert.rejects(reader.getJson('manifest.json'), /parse failed/);
  assert.equal(await reader.getJson('missing'), undefined);
  assert.equal(requests, 2);
});

test('missing indexes fail without probing legacy roots and can be retried', async (t) => {
  const ref = snapshot('index-missing');
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    requests++;
    assert.equal(String(input), `https://dump.invalid/${snapshotRoot(ref)}/objects.json.gz`);
    return requests === 1 ? new Response(null, { status: 404 }) : compressed({ files: {}, artifacts: {} });
  });
  const reader = new JsonDumpReader(ref);
  await assert.rejects(reader.getJson('manifest.json'), /objects.json.gz/);
  assert.equal(await reader.getJson('manifest.json'), undefined);
  assert.equal(requests, 2);
});

test('JSON-backed row tables yield bounded batches', async (t) => {
  const ref = snapshot('batches');
  const root = snapshotRoot(ref);
  const rows = Object.fromEntries(Array.from({ length: 2050 }, (_, i) => [`row${i}`, i]));
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) =>
    String(input).endsWith('/objects.json.gz')
      ? compressed({
        files: { 'table.ndjson': `${root}/table.json` },
        artifacts: { 'table.ndjson': descriptor() },
      })
      : Response.json(rows));
  const batches: [string, unknown][][] = [];
  for await (const batch of new JsonDumpReader(ref).ndjsonRows('table.ndjson')) batches.push(batch);
  assert.deepEqual(batches.map((batch) => batch.length), [1024, 1024, 2]);
  assert.deepEqual(Object.fromEntries(batches.flat()), rows);
});
