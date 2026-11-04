import 'server-only';
import { fumadb, type InferFumaDB } from 'fumadb';
import { kyselyAdapter } from 'fumadb/adapters/kysely';
import { column, idColumn, schema, table } from 'fumadb/schema';
import { Kysely, sql } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { d1Binding, type D1Binding, type D1PreparedStatement } from './d1';
import { env } from './env';

const v1 = schema({
  version: '1.0.0',
  tables: {
    shares: table('shares', {
      scope: idColumn('scope', 'varchar(255)'),
      tree: column('tree', 'string'),
      created: column('created', 'integer'),
    }),
    analytics: table('analytics', {
      key: idColumn('key', 'varchar(255)'),
      views: column('views', 'integer'),
    }),
  },
});

const DB_NAMESPACE = env('DB_NAME') ?? 'wiki';

export const AppDB = fumadb({ namespace: DB_NAMESPACE, schemas: [v1] });

export type AppDbClient = InferFumaDB<typeof AppDB>;
export type DataOrm = ReturnType<AppDbClient['orm']>;

type D1RestResult = {
  results?: Record<string, unknown>[];
  success?: boolean;
  meta?: { changes?: number; last_row_id?: number };
};

function remoteD1({
  accountId,
  databaseId,
  token,
}: {
  accountId: string;
  databaseId: string;
  token: string;
}): D1Binding {
  const call = async (sql: string, params: unknown[]) => {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      },
    );
    if (!res.ok) throw new Error(`D1 REST ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { result?: D1RestResult[] };
    const first = body.result?.[0];
    if (!first?.success) throw new Error('D1 query failed');
    return first;
  };
  return {
    prepare: (sql) => {
      let bound: unknown[] = [];
      const statement: D1PreparedStatement = {
        bind: (...params: unknown[]) => {
          bound = params;
          return statement;
        },
        all: async <T,>() => {
          const res = await call(sql, bound);
          return { results: (res.results ?? []) as T[], meta: res.meta };
        },
        first: async <T,>(column?: string) => {
          const row = (await call(sql, bound)).results?.[0] as
            | T
            | undefined;
          if (row == null || !column) return (row ?? null) as T | null;
          return (row as Record<string, unknown>)[column] as T;
        },
        run: async <T,>() => (await call(sql, bound)) as T,
      };
      return statement;
    },
    exec: async (sql) => call(sql, []),
  };
}

function resolveD1(): D1Binding | undefined {
  const bound = d1Binding(env('D1_BINDING') ?? 'DB');
  if (bound) return bound;
  const accountId = env('CLOUDFLARE_ACCOUNT_ID');
  const databaseId = env('CLOUDFLARE_D1_DATABASE_ID');
  const token = env('CLOUDFLARE_API_TOKEN');
  return accountId && databaseId && token
    ? remoteD1({ accountId, databaseId, token })
    : undefined;
}

const DDL = [
  'CREATE TABLE IF NOT EXISTS shares (scope TEXT PRIMARY KEY, tree TEXT NOT NULL, created INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS analytics (key TEXT PRIMARY KEY, views INTEGER NOT NULL)',
  `CREATE TABLE IF NOT EXISTS private_${DB_NAMESPACE}_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `INSERT OR IGNORE INTO private_${DB_NAMESPACE}_settings (key, value) VALUES ('version', '1.0.0')`,
];

let ready: Promise<AppDbClient | undefined> | undefined;
let kyselyDb: Kysely<unknown> | undefined;

export function dbKysely(): Kysely<unknown> | undefined {
  return kyselyDb;
}

export function dbSql(strings: TemplateStringsArray, ...values: unknown[]) {
  const db = kyselyDb;
  return db ? sql(strings, ...values).execute(db) : undefined;
}

export function dataDb(): Promise<AppDbClient | undefined> {
  const p = (ready ??= (async () => {
    const d1 = resolveD1();
    if (!d1) return undefined;
    for (const sql of DDL) await d1.exec?.(sql);
    const db = new Kysely({
      dialect: new D1Dialect({ database: d1 as never }),
    });
    kyselyDb = db;
    return AppDB.client(kyselyAdapter({ provider: 'sqlite', db }));
  })());
  p.catch(() => {
    if (ready === p) ready = undefined;
  });
  return p;
}

export async function dbOrm(): Promise<DataOrm | undefined> {
  const client = await dataDb();
  return client ? client.orm(await client.version()) : undefined;
}

