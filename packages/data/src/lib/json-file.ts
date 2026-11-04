import 'server-only';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function loadJsonFile<T>(file: string, fallback: () => T): T {
  try {
    return JSON.parse(
      readFileSync(/* turbopackIgnore: true */ file, 'utf8'),
    ) as T;
  } catch {
    return fallback();
  }
}

export function saveJsonFile(file: string, data: unknown, space?: number): void {
  mkdirSync(/* turbopackIgnore: true */ dirname(file), { recursive: true });
  writeFileSync(
    /* turbopackIgnore: true */ file,
    JSON.stringify(data, null, space),
  );
}

export function jsonFileStore<T>(file: string, fallback: () => T, space?: number) {
  let cached: T | undefined;
  const store = {
    get data(): T {
      return (cached ??= loadJsonFile(file, fallback));
    },
    save(): void {
      saveJsonFile(file, store.data, space);
    },
  };
  return store;
}

