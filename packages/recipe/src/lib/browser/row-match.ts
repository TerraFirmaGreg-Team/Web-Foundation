import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export function refsMatchBase(
  refs: readonly string[] | undefined,
  base: string,
): boolean {
  return !!refs?.some((ref) => stackIdBase(ref) === base);
}
