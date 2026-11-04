export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(column?: string): Promise<T | null>;
  run<T>(): Promise<T>;
  all<T>(): Promise<{
    results: T[];
    meta?: { changes?: number; last_row_id?: number };
  }>;
};

export type D1Binding = {
  prepare(query: string): D1PreparedStatement;
  exec?(query: string): Promise<unknown>;
};

export function d1Binding(name: string): D1Binding | undefined {
  const db = (process.env as Record<string, unknown>)[name];
  return db && typeof (db as D1Binding).prepare === 'function'
    ? (db as D1Binding)
    : undefined;
}

