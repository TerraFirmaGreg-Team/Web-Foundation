export const env = (key: string): string | undefined =>
  process.env[key]?.trim() || undefined;

export function dumpStorageBase(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_DUMP_STORAGE_URL?.trim();
  return raw ? raw.replace(/\/+$/, '') : undefined;
}

export function dumpStorageOrigin(): string | undefined {
  const base = dumpStorageBase();
  if (!base) return undefined;
  try {
    return new URL(base).origin;
  } catch {
    return undefined;
  }
}

