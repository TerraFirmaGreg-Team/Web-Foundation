import 'server-only';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { dataDb, dbSql } from './db';
import { loadJsonFile, saveJsonFile } from './json-file';

type Entry = { value: unknown; expires: number };

let tableReady: Promise<unknown> | undefined;

function fileFor(key: string): string {
  const name = key.replace(/[^a-z0-9._-]+/gi, '_').slice(0, 60);
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 8);
  return join(process.cwd(), 'data', 'cache', `${name}-${hash}.json`);
}

async function d1Read(key: string): Promise<Entry | undefined> {
  try {
    tableReady ??= dbSql`
      CREATE TABLE IF NOT EXISTS tfg_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)
    `;
    await tableReady;
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
    await tableReady;
    await dbSql`
      INSERT OR REPLACE INTO tfg_cache (key, value, expires)
      VALUES (${key}, ${JSON.stringify(entry.value)}, ${entry.expires})
    `;
  } catch {}
}

export async function persistentCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T | undefined>,
): Promise<T | undefined> {
  const db = await dataDb().catch(() => undefined);
  const file = fileFor(key);
  const entry = db
    ? await d1Read(key)
    : loadJsonFile<Entry | undefined>(file, () => undefined);
  if (entry && entry.expires > Date.now()) return entry.value as T;
  const value = await loader();
  if (value === undefined) return entry?.value as T | undefined;
  const next: Entry = { value, expires: Date.now() + ttlMs };
  if (db) await d1Write(key, next);
  else saveJsonFile(file, next);
  return value;
}
