import type { GuideMultiblock } from '@terrafirmagreg-team/guide/lib/data/dto';

export function asMultiblock(
  value: string | GuideMultiblock | undefined,
): { id?: string; data?: GuideMultiblock } {
  if (!value) return {};
  if (typeof value === 'string') return { id: value };
  return { data: value };
}

