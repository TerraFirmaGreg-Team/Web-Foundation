import 'server-only';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { dataDb, dbSql } from './db';
import { loadJsonFile, saveJsonFile } from './json-file';

type Entry = { value: unknown; expires: number };

let tableReady: Promise<unknown> | undefined;

const ready = () =>
  (tableReady ??= dbSql`
    CREATE TABLE IF NOT EXISTS tfg_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)
  `);

function fileFor(key: string): string {
  const name = key.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 60);
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 8);
  return join(process.cwd(), 'data', 'cache', `${name}-${hash}.json`);
}

async function d1Read(key: string): Promise<Entry | undefined> {
  try {
    await ready();
    const rows = (await dbSql`
      SELECT value, expires FROM tfg_cache WHERE key = ${key}
    `) as { rows?: { value: string; expires: number }[] } | undefined;
    const row = rows?.rows?.[0];
    return row
      ? { value: JSON.parse(row.value), expires: row.expires }
      : undefined;
  } catch {
    return undefined;
  }
}

async function d1Write(key: string, entry: Entry): Promise<void> {
  try {
    await ready();
    await dbSql`
      INSERT OR REPLACE INTO tfg_cache (key, value, expires)
      VALUES (${key}, ${JSON.stringify(entry.value)}, ${entry.expires})
    `;
  } catch {}
}

type Db = NonNullable<Awaited<ReturnType<typeof dataDb>>>;

async function readEntry(
  db: Db | undefined,
  key: string,
): Promise<Entry | undefined> {
  return db
    ? await d1Read(key)
    : loadJsonFile<Entry | undefined>(fileFor(key), () => undefined);
}

async function writeEntry(
  db: Db | undefined,
  key: string,
  entry: Entry,
): Promise<void> {
  if (db) await d1Write(key, entry);
  else {
    try {
      saveJsonFile(fileFor(key), entry);
    } catch {}
  }
}

export async function persistentGet<T>(
  key: string,
): Promise<{ value: T; expires: number } | undefined> {
  const db = await dataDb().catch(() => undefined);
  return (await readEntry(db, key)) as
    | { value: T; expires: number }
    | undefined;
}

export async function persistentSet(
  key: string,
  value: unknown,
  ttlMs: number,
): Promise<void> {
  const db = await dataDb().catch(() => undefined);
  await writeEntry(db, key, { value, expires: Date.now() + ttlMs });
}

const inflight = new Map<string, Promise<unknown>>();

async function loadAndStore<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T | undefined>,
  db: Db | undefined,
): Promise<T | undefined> {
  const value = await loader();
  if (value === undefined) return undefined;
  await writeEntry(db, key, { value, expires: Date.now() + ttlMs });
  return value;
}

export async function persistentCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T | undefined>,
  opts?: { staleWhileRevalidate?: boolean },
): Promise<T | undefined> {
  const db = await dataDb().catch(() => undefined);
  const entry = await readEntry(db, key);
  if (entry && entry.expires > Date.now()) return entry.value as T;
  if (entry && opts?.staleWhileRevalidate) {
    const pending =
      inflight.get(key) ??
      loadAndStore(key, ttlMs, loader, db).finally(() =>
        inflight.delete(key),
      );
    inflight.set(key, pending);
    void pending.catch(() => {});
    return entry.value as T;
  }
  const value = await loadAndStore(key, ttlMs, loader, db);
  return value ?? (entry?.value as T | undefined);
}
