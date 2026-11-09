export type AsyncCache<A extends unknown[], V> = ((
  ...args: A
) => Promise<V>) & {
  peek: (...args: A) => V | undefined;
};

const MISS_TTL = 60_000;

export function createAsyncCache<A extends unknown[], V>(
  loader: (...args: A) => Promise<V>,
  keyOf: (...args: A) => string = (...args) => JSON.stringify(args),
  ttl?: number,
): AsyncCache<A, V> {
  const cache = new Map<string, Promise<V>>();
  const resolved = new Map<string, V>();
  const expiry = new Map<string, number>();
  const expired = (key: string) => {
    const at = expiry.get(key);
    return at !== undefined && at <= Date.now();
  };
  const call = (...args: A) => {
    const key = keyOf(...args);
    let pending = cache.get(key);
    if (pending && expired(key)) {
      cache.delete(key);
      resolved.delete(key);
      expiry.delete(key);
      pending = undefined;
    }
    if (!pending) {
      pending = loader(...args)
        .then((value) => {
          resolved.set(key, value);
          const life = value === undefined ? MISS_TTL : ttl;
          if (life !== undefined) expiry.set(key, Date.now() + life);
          return value;
        })
        .catch((err) => {
          cache.delete(key);
          throw err;
        });
      cache.set(key, pending);
    }
    return pending;
  };
  call.peek = (...args: A) => {
    const key = keyOf(...args);
    return expired(key) ? undefined : resolved.get(key);
  };
  return call;
}

