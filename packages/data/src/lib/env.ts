export const env = (key: string): string | undefined =>
  process.env[key]?.trim() || undefined;

export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export type FeatureMode = 'dev' | 'prod' | 'off';

export function featureMode(name: string): FeatureMode {
  const raw = env(`${name}_MODE`)?.toLowerCase();
  return raw === 'dev' || raw === 'prod' ? raw : 'off';
}

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

