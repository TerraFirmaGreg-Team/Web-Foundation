import { DUMP_POINTER_TTL, JsonDumpReader } from '@terrafirmagreg-team/dump/lib/dump/json-reader';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import {
  createAsyncCache,
  type AsyncCache,
} from '@terrafirmagreg-team/data/lib/async-cache';

export interface DumpReader {
  getJson(path: string, priority?: 'high'): Promise<unknown | undefined>;
  getLang(lang: string): Promise<Record<string, string>>;
  getLangRaw(lang: string): Promise<Record<string, string>>;
  getNames(lang: string): Promise<Record<string, string>>;
}

export function createDatasetCache<A extends unknown[], V>(
  loader: (dataset: DatasetRef, ...rest: A) => Promise<V>,
  keyOf: (...args: [dataset: DatasetRef, ...rest: A]) => string =
    ({ id, version }, ...rest) => JSON.stringify([id, version ?? '', ...rest]),
): AsyncCache<[dataset: DatasetRef, ...rest: A], V> {
  const versioned = createAsyncCache(loader, keyOf);
  const latest = createAsyncCache(loader, keyOf, DUMP_POINTER_TTL);
  const pick = (dataset: DatasetRef) => dataset.version ? versioned : latest;
  const call = (dataset: DatasetRef, ...rest: A) => pick(dataset)(dataset, ...rest);
  call.peek = (dataset: DatasetRef, ...rest: A) =>
    pick(dataset).peek(dataset, ...rest);
  return call;
}

export const dumpReader = createDatasetCache(
  async (dataset: DatasetRef): Promise<DumpReader> => new JsonDumpReader(dataset),
);

