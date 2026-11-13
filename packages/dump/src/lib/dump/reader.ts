import { JsonDumpReader } from '@terrafirmagreg-team/dump/lib/dump/json-reader';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import { peekDatasetSnapshot, resolveDatasetSnapshot } from './snapshot';
import {
  createAsyncCache,
  type AsyncCache,
} from '@terrafirmagreg-team/data/lib/async-cache';

export interface DumpReader {
  getJson(path: string, priority?: 'high'): Promise<unknown | undefined>;
  getNames(lang: string): Promise<Record<string, string>>;
  ndjsonRows(path: string): AsyncIterable<[string, unknown][]>;
}

export function createDatasetCache<A extends unknown[], V>(
  loader: (dataset: DatasetRef, ...rest: A) => Promise<V>,
  keyOf: (...args: [dataset: DatasetRef, ...rest: A]) => string =
    (dataset, ...rest) => datasetCacheKey(dataset, ...rest),
): AsyncCache<[dataset: DatasetRef, ...rest: A], V> {
  const cache = createAsyncCache(loader, (dataset: DatasetRef, ...rest: A) =>
    datasetCacheKey(dataset, keyOf(dataset, ...rest)));
  const call = async (dataset: DatasetRef, ...rest: A) =>
    cache(await resolveDatasetSnapshot(dataset), ...rest);
  call.peek = (dataset: DatasetRef, ...rest: A) => {
    const snapshot = peekDatasetSnapshot(dataset);
    return snapshot ? cache.peek(snapshot, ...rest) : undefined;
  };
  return call;
}

export const dumpReader = createDatasetCache(
  async (dataset: DatasetRef): Promise<DumpReader> => new JsonDumpReader(dataset),
);
