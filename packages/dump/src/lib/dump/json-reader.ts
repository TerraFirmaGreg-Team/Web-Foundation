import {
  dumpStorageUrl,
  registerDumpLocation,
  type DumpLocation,
} from '@terrafirmagreg-team/dump/lib/dump/paths';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { DumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import {
  createAsyncCache,
  type AsyncCache,
} from '@terrafirmagreg-team/data/lib/async-cache';
import { markDumpResult } from '@terrafirmagreg-team/data/lib/dump-status';
import { serverCache } from '@terrafirmagreg-team/data/lib/server-cache';
import { isBuildPhase } from '@terrafirmagreg-team/data/lib/env';
import { parseSnapshotIndex, resolveDatasetSnapshot, snapshotPath, type ResolvedSnapshot } from './snapshot';
export { DUMP_POINTER_TTL } from './snapshot';

const SAFE_LANG_CODE = /^[a-z0-9]+(_[a-z0-9]+)*$/i;

function cleanLangCode(code: string): string | undefined {
  return SAFE_LANG_CODE.test(code) ? code : undefined;
}

const MAX_INFLIGHT = typeof window === 'undefined' ? 24 : 12;
const lanes = {
  high: [] as Array<() => void>,
  normal: [] as Array<() => void>,
};
let inflight = 0;

function pump() {
  while (inflight < MAX_INFLIGHT) {
    const run = lanes.high.shift() ?? lanes.normal.shift();
    if (!run) return;
    inflight++;
    run();
  }
}

function fetchLane<T>(task: () => Promise<T>, high: boolean): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () =>
      task()
        .then(resolve, reject)
        .finally(() => {
          inflight--;
          pump();
        });
    (high ? lanes.high : lanes.normal).push(run);
    pump();
  });
}

const FETCH_TIMEOUT = 20_000;

function fetchCache(url: string, mutable: boolean): RequestCache {
  return !mutable || url.includes('/objects/') ? 'default' : 'no-cache';
}

async function request(
  url: string,
  mutable: boolean,
  high = false,
): Promise<Response | undefined> {
  const cache = fetchCache(url, mutable);
  const init: RequestInit = {
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
    cache,
  };
  if (high) init.priority = 'high';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch {

    }
  }
  return undefined;
}

const REQUIRED_FILE = /\/(?:versions|manifest|objects)\.json(?:\.gz)?$/;

function markDumpFetch(
  datasetId: string | undefined,
  url: string,
  res: Response | undefined,
  ok: boolean,
) {
  if (!datasetId) return;
  if (res?.status === 404 && !REQUIRED_FILE.test(url)) return;
  markDumpResult(datasetId, ok);
}

class DumpNotFound extends Error {}

const PARSE_WORKER_SOURCE = `self.onmessage=(e)=>{const{id,text}=e.data;try{self.postMessage({id,value:JSON.parse(text)})}catch(error){self.postMessage({id,error:String(error)})}}`;

let parseWorker: Worker | undefined;
let parseSeq = 0;
const parsePending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>();

function ndjsonRowEntry(
  line: string,
): [string, unknown] | undefined {
  const row = JSON.parse(line) as Record<string, unknown> | null;
  if (!row || typeof row !== 'object' || Array.isArray(row)) return undefined;
  const keys = Object.keys(row);
  if (keys.length === 1) return [keys[0]!, row[keys[0]!]];
  if (typeof row.id === 'string') return [row.id, row];
  return undefined;
}

async function readNdjsonRows(
  body: ReadableStream<Uint8Array>,
  onRow: (entry: [string, unknown]) => void,
  onBytes?: (n: number) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      onBytes?.(value.length);
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const entry = ndjsonRowEntry(line);
        if (entry) onRow(entry);
      }
    }
    buffer += decoder.decode();
    if (buffer) {
      const entry = ndjsonRowEntry(buffer);
      if (entry) onRow(entry);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamNdjson(
  url: string,
  compression: 'gzip' | 'none',
): AsyncGenerator<[string, unknown][]> {
  const res = await request(url, false);
  if (!res?.ok || !res.body) throw new Error(`dump fetch failed: ${url}`);
  const body = compression === 'gzip'
    ? res.body.pipeThrough(new DecompressionStream('gzip'))
    : res.body;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let batch: [string, unknown][] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const entry = ndjsonRowEntry(line);
        if (entry) batch.push(entry);
      }
      if (batch.length) {
        yield batch;
        batch = [];
      }
    }
    buffer += decoder.decode();
    if (buffer) {
      const entry = ndjsonRowEntry(buffer);
      if (entry) batch.push(entry);
    }
    if (batch.length) yield batch;
  } finally {
    reader.releaseLock();
  }
}

function parseJson(text: string): Promise<unknown> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve(JSON.parse(text));
  }
  try {
    if (!parseWorker) {
      const url = URL.createObjectURL(
        new Blob([PARSE_WORKER_SOURCE], { type: 'text/javascript' }),
      );
      parseWorker = new Worker(url);
      URL.revokeObjectURL(url);
      parseWorker.onmessage = (event: MessageEvent) => {
        const { id, value, error } = event.data as {
          id: number;
          value?: unknown;
          error?: string;
        };
        const slot = parsePending.get(id);
        if (!slot) return;
        parsePending.delete(id);
        if (error !== undefined) slot.reject(new Error(error));
        else slot.resolve(value);
      };
      parseWorker.onerror = () => {
        const pending = [...parsePending.values()];
        parsePending.clear();
        parseWorker = undefined;
        for (const slot of pending) {
          slot.reject(new Error('dump parse worker crashed'));
        }
      };
    }
    const id = ++parseSeq;
    return new Promise((resolve, reject) => {
      parsePending.set(id, { resolve, reject });
      parseWorker!.postMessage({ id, text });
    });
  } catch {
    return Promise.resolve(JSON.parse(text));
  }
}

const SERVER_CACHE_MAX = 1_500_000;

class DumpTooBig extends Error {
  constructor(readonly value: unknown) {
    super('dump value too large for server cache');
  }
}

async function fetchAndParse(
  url: string,
  gz: boolean,
  mutable: boolean,
  high: boolean,
  datasetId?: string,
): Promise<unknown> {
  const res = await request(url, mutable, high);
  if (res?.status === 404) {
    markDumpFetch(datasetId, url, res, false);
    throw new DumpNotFound(url);
  }
  if (!res?.ok || (gz && !res.body)) {
    markDumpFetch(datasetId, url, res, false);
    throw new Error(`dump fetch failed: ${url}`);
  }
  markDumpFetch(datasetId, url, res, true);
  try {
    const text = gz
      ? await new Response(
          res.body!.pipeThrough(new DecompressionStream('gzip')),
        ).text()
      : await res.text();
    const value = await parseJson(text);
    if (url.endsWith('/objects.json.gz')) parseSnapshotIndex(value);
    if (text.length > SERVER_CACHE_MAX) throw new DumpTooBig(value);
    return value;
  } catch (error) {
    if (error instanceof DumpTooBig) throw error;
    if (datasetId) markDumpResult(datasetId, false);
    throw new Error(`dump parse failed: ${url}`);
  }
}

async function fetchAndParseNdjson(
  url: string,
  gz: boolean,
  mutable: boolean,
  high: boolean,
  datasetId?: string,
): Promise<Record<string, unknown>> {
  const res = await request(url, mutable, high);
  if (res?.status === 404) {
    markDumpFetch(datasetId, url, res, false);
    throw new DumpNotFound(url);
  }
  if (!res?.ok || !res.body) {
    markDumpFetch(datasetId, url, res, false);
    throw new Error(`dump fetch failed: ${url}`);
  }
  markDumpFetch(datasetId, url, res, true);
  try {
    const body = gz
      ? res.body.pipeThrough(new DecompressionStream('gzip'))
      : res.body;
    const out: Record<string, unknown> = {};
    let bytes = 0;
    await readNdjsonRows(
      body,
      ([key, value]) => {
        out[key] = value;
      },
      (n) => {
        bytes += n;
      },
    );
    if (bytes > SERVER_CACHE_MAX) throw new DumpTooBig(out);
    return out;
  } catch (error) {
    if (error instanceof DumpTooBig) throw error;
    if (datasetId) markDumpResult(datasetId, false);
    throw new Error(`dump parse failed: ${url}`);
  }
}

const makeLoader =
  (
    gz: boolean,
    mutable: boolean,
    fetcher: (
      url: string,
      gz: boolean,
      mutable: boolean,
      high: boolean,
      datasetId?: string,
    ) => Promise<unknown>,
  ) =>
  async (
    url: string,
    high: boolean,
    datasetId?: string,
  ): Promise<unknown> => {
    if (isBuildPhase()) throw new Error(`Dump unavailable during build: ${url}`);
    const load = () =>
      fetchLane(() => fetcher(url, gz, mutable, high, datasetId), high);
    const attempt = async () => {
      try {
        return await load();
      } catch (error) {
        if (error instanceof DumpTooBig) return error.value;
        throw error;
      }
    };
    const cache = serverCache();
    if (!cache) return attempt();
    try {
      return await cache(`dump-json:${url}`, load, mutable ? 60 : false);
    } catch (error) {
      if (error instanceof DumpTooBig) return error.value;
      return attempt();
    }
  };

const fetchJson = createAsyncCache(
  makeLoader(false, false, fetchAndParse),
  (url: string) => url,
) as AsyncCache<[url: string, high: boolean, datasetId?: string], unknown>;

const fetchJsonGz = createAsyncCache(
  makeLoader(true, false, fetchAndParse),
  (url: string) => url,
) as AsyncCache<[url: string, high: boolean, datasetId?: string], unknown>;

const fetchNdjson = createAsyncCache(
  makeLoader(false, false, fetchAndParseNdjson),
  (url: string) => url,
) as AsyncCache<[url: string, high: boolean, datasetId?: string], unknown>;

const fetchNdjsonGz = createAsyncCache(
  makeLoader(true, false, fetchAndParseNdjson),
  (url: string) => url,
) as AsyncCache<[url: string, high: boolean, datasetId?: string], unknown>;

export class JsonDumpReader implements DumpReader {
  private locationCache: Promise<DumpLocation> | undefined;
  private snapshotCache: Promise<ResolvedSnapshot> | undefined;
  private namesCache = createAsyncCache((code: string) =>
    this.getJson(`names/${code}.ndjson`).then((raw) => {
        if (
          !raw ||
          typeof raw !== 'object' ||
          Array.isArray(raw) ||
          !Object.entries(raw).every(
            ([key, value]) =>
              key.length > 0 &&
              typeof value === 'string' &&
              value.length > 0,
          )
        ) {
          throw new Error(
            `dump names file missing or invalid: names/${code} (${this.packId})`,
          );
        }
        return raw as Record<string, string>;
      }),
  );
  private readonly dataset: DatasetRef;
  private readonly packId: string;
  private readonly statusKey: string;

  constructor(dataset: DatasetRef) {
    this.dataset = dataset;
    this.packId = dataset.id;
    this.statusKey = datasetCacheKey(dataset);
  }

  getJson(path: string, priority?: 'high'): Promise<unknown | undefined> {
    const high = priority === 'high';
    snapshotPath(path);
    return this.location().then((loc) => {
      const key = loc.files?.[path];
      if (!key) return undefined;
      const artifact = loc.artifacts![path]!;
      if (artifact.codec === 'binary') throw new Error(`Binary dump artifact: ${path}`);
      const loader = artifact.codec === 'ndjson'
        ? artifact.compression === 'gzip' ? fetchNdjsonGz : fetchNdjson
        : artifact.compression === 'gzip' ? fetchJsonGz : fetchJson;
      return loader(dumpStorageUrl(key), high, this.statusKey).then((value) => {
        if (value === undefined) throw new Error(`Snapshot artifact missing: ${path}`);
        return value;
      });
    });
  }

  async *ndjsonRows(path: string): AsyncGenerator<[string, unknown][]> {
    snapshotPath(path);
    const loc = await this.location();
    const key = loc.files?.[path];
    if (!key) return;
    const artifact = loc.artifacts![path]!;
    if (artifact.codec === 'binary') throw new Error(`Binary dump artifact: ${path}`);
    if (artifact.codec === 'ndjson') {
      yield* streamNdjson(dumpStorageUrl(key), artifact.compression);
      return;
    }
    const raw = await this.getJson(path);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error(`Invalid row map: ${path}`);
    }
    let batch: [string, unknown][] = [];
    for (const entry of Object.entries(raw)) {
      batch.push(entry);
      if (batch.length === 1024) {
        yield batch;
        batch = [];
      }
    }
    if (batch.length) yield batch;
  }

  getNames(lang: string): Promise<Record<string, string>> {
    const code = cleanLangCode(lang);
    if (!code) {
      return Promise.reject(new Error(`dump names invalid lang "${lang}"`));
    }
    return this.namesCache(code);
  }

  private location(): Promise<DumpLocation> {
    const p = (this.locationCache ??= this.resolveLocation());
    p.catch(() => {
      if (this.locationCache === p) this.locationCache = undefined;
    });
    return p;
  }

  private async resolveLocation(): Promise<DumpLocation> {
    if (!this.snapshotCache) {
      const pending = resolveDatasetSnapshot(this.dataset);
      this.snapshotCache = pending;
      pending.catch(() => {
        if (this.snapshotCache === pending) this.snapshotCache = undefined;
      });
    }
    const snapshot = await this.snapshotCache;
    const raw = await fetchJsonGz(
      dumpStorageUrl(snapshot.index),
      true,
      datasetCacheKey(snapshot),
    );
    const root = snapshot.index.slice(
      0,
      snapshot.index.length - '/objects.json.gz'.length,
    );
    const loc = { root, ...parseSnapshotIndex(raw) };
    registerDumpLocation(snapshot, loc);
    return loc;
  }
}
