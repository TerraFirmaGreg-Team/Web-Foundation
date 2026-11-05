import { parseDumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/parse';
import {
  dumpStorageUrl,
  registerDumpLocation,
  type DumpLocation,
} from '@terrafirmagreg-team/dump/lib/dump/paths';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { DumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';

const SAFE_LANG_CODE = /^[a-z0-9]+(_[a-z0-9]+)*$/i;

function cleanLangCode(code: string): string | undefined {
  return SAFE_LANG_CODE.test(code) ? code : undefined;
}

const MAX_INFLIGHT = 12;
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

async function request(url: string): Promise<Response | undefined> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });
    } catch {

    }
  }
  return undefined;
}

export const DUMP_POINTER_TTL = 60_000;

const fetchJsonLoader = async (url: string, high: boolean) =>
  fetchLane(async () => {
    try {
      const res = await request(url);
      if (!res?.ok) return undefined;
      return (await res.json()) as unknown;
    } catch {
      return undefined;
    }
  }, high);

const fetchJsonGzLoader = async (url: string, high: boolean) =>
  fetchLane(async () => {
    try {
      const res = await request(url);
      if (!res?.ok || !res.body) return undefined;
      const text = await new Response(
        res.body.pipeThrough(new DecompressionStream('gzip')),
      ).text();
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  }, high);

const fetchJson = createAsyncCache(fetchJsonLoader, (url) => url);

const fetchJsonGz = createAsyncCache(fetchJsonGzLoader, (url) => url);

const fetchJsonMutable = createAsyncCache(
  fetchJsonLoader,
  (url) => url,
  DUMP_POINTER_TTL,
);

const fetchJsonGzMutable = createAsyncCache(
  fetchJsonGzLoader,
  (url) => url,
  DUMP_POINTER_TTL,
);

export const COMPRESSED_TREE = /^(?:data|meta)\//;

function toLangMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    map[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return map;
}

export class JsonDumpReader implements DumpReader {
  private manifestCache: Promise<ReturnType<typeof parseDumpManifest>> | undefined;
  private locationCache: Promise<DumpLocation> | undefined;
  private langCache = createAsyncCache((code: string) => this.loadLang(code));
  private langRawCache = createAsyncCache((code: string) =>
    this.loadLangRaw(code),
  );
  private readonly packId: string;
  private readonly version?: string;

  constructor(private dataset: DatasetRef) {
    const ref = dataset;
    this.packId = ref.id;
    this.version = ref.version;
  }

  getJson(path: string, priority?: 'high'): Promise<unknown | undefined> {
    const high = priority === 'high';
    if (path === 'versions.json') {
      return fetchJsonMutable(
        dumpStorageUrl(`${this.packId}/versions.json`),
        high,
      );
    }
    return this.location().then((loc) => {
      const key = loc.files?.[path];
      if (key) {
        return key.endsWith('.gz')
          ? fetchJsonGz(dumpStorageUrl(`${key}`), high)
          : fetchJson(dumpStorageUrl(`${key}`), high);
      }

      if (loc.files) return undefined;
      const rel = `${loc.root}/${path}`;
      const [json, jsonGz] =
        loc.root === this.packId
          ? [fetchJsonMutable, fetchJsonGzMutable]
          : [fetchJson, fetchJsonGz];
      return COMPRESSED_TREE.test(path)
        ? jsonGz(dumpStorageUrl(`${rel}.gz`), high)
        : json(dumpStorageUrl(`${rel}`), high);
    });
  }

  getLang(lang: string): Promise<Record<string, string>> {
    const code = cleanLangCode(lang);
    return code ? this.langCache(code) : Promise.resolve({});
  }

  getLangRaw(lang: string): Promise<Record<string, string>> {
    const code = cleanLangCode(lang);
    return code ? this.langRawCache(code) : Promise.resolve({});
  }

  private location(): Promise<DumpLocation> {
    const p = (this.locationCache ??= this.resolveLocation());
    p.catch(() => {
      if (this.locationCache === p) this.locationCache = undefined;
    });
    return p;
  }

  private async resolveLocation(): Promise<DumpLocation> {
    if (this.version) {
      const root = `${this.packId}/${this.version}`;
      const loc: DumpLocation = { root, files: await this.objectsIndex(root) };
      registerDumpLocation(this.dataset, loc);
      return loc;
    }
    const versions = (await fetchJsonMutable(
      dumpStorageUrl(`${this.packId}/versions.json`),
      true,
    )) as { latest?: string } | undefined;
    if (versions?.latest) {
      const root = `${this.packId}/${versions.latest}`;

      const exists = await fetchJson(
        dumpStorageUrl(`${root}/manifest.json`),
        false,
      );
      if (exists) {
        const loc: DumpLocation = { root, files: await this.objectsIndex(root) };
        registerDumpLocation(this.dataset, loc);
        registerDumpLocation({ id: this.packId, version: versions.latest }, loc);
        return loc;
      }
    }
    const loc: DumpLocation = { root: this.packId };
    registerDumpLocation(this.dataset, loc);
    return loc;
  }

  private async objectsIndex(
    root: string,
  ): Promise<Record<string, string> | undefined> {
    const raw =
      (await fetchJsonGz(
        dumpStorageUrl(`${root}/objects.json.gz`),
        false,
      )) ??
      (await fetchJson(dumpStorageUrl(`${root}/objects.json`), false));
    const files =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>).files
        : undefined;
    if (!files || typeof files !== 'object' || Array.isArray(files)) {
      return undefined;
    }
    const out: Record<string, string> = {};
    for (const [rel, key] of Object.entries(files)) {
      if (typeof key === 'string') out[rel] = key;
    }
    return out;
  }

  private manifest() {
    const p = (this.manifestCache ??= this.getJson('manifest.json').then((raw) =>
      parseDumpManifest(raw),
    ));
    p.catch(() => {
      if (this.manifestCache === p) this.manifestCache = undefined;
    });
    return p;
  }

  private async loadLang(lang: string): Promise<Record<string, string>> {
    const codes = lang === 'en_us' ? ['en_us'] : ['en_us', lang];
    const loc = await this.location();
    const base = loc.files ? 'lang' : 'meta/lang';
    const metaMaps = await Promise.all(
      codes.map((code) =>
        this.getJson(`${base}/${code}.json`).then(toLangMap),
      ),
    );
    return Object.assign({}, ...metaMaps);
  }

  private async loadLangRaw(code: string): Promise<Record<string, string>> {
    const loc = await this.location();
    const base = loc.files ? 'lang' : 'meta/lang';
    return this.getJson(`${base}/${code}.json`).then(toLangMap);
  }
}

