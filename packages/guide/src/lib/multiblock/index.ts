import type { GuideMultiblock } from '@terrafirmagreg-team/guide/types';

export function multiblockKey(
  spec: { id?: string; data?: GuideMultiblock } | undefined,
): string | undefined {
  if (!spec) return undefined;
  return spec.id ?? (spec.data ? `data:${JSON.stringify(spec.data)}` : undefined);
}

