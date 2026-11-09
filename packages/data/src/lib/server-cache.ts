export type ServerCacheLoad = (
  key: string,
  loader: () => Promise<unknown>,
  revalidate: number | false,
) => Promise<unknown>;

const store = globalThis as Record<symbol, unknown>;

export function registerServerCache(load: ServerCacheLoad): void {
  store[Symbol.for('terrafirmagreg.serverCache')] = load;
}

export function serverCache(): ServerCacheLoad | undefined {
  return store[Symbol.for('terrafirmagreg.serverCache')] as
    | ServerCacheLoad
    | undefined;
}
