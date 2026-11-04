import type { CalcKind, CalcMaterial } from '@terrafirmagreg-team/recipe/types/calc';

export function materialKey(kind: CalcKind, id: string): string {
  return `${kind}:${id}`;
}

export function mergeAmounts(list: CalcMaterial[]): CalcMaterial[] {
  const map = new Map<string, CalcMaterial>();
  for (const row of list) {
    const key = materialKey(row.kind, row.id);
    const existing = map.get(key);
    if (existing) existing.amount += row.amount;
    else map.set(key, { ...row });
  }
  return [...map.values()];
}

export function deduplicateMaterials(list: CalcMaterial[]): CalcMaterial[] {
  const seen = new Set<string>();
  const result: CalcMaterial[] = [];
  for (const row of list) {
    const key = materialKey(row.kind, row.id);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...row });
  }
  return result;
}

