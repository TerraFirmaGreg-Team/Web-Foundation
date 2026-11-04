export function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function asBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1) return true;
  if (value === 0) return false;
  return undefined;
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item));
}

export const EDGE_TABLE_FIELD = '$ids';

export function asIdTable(file: unknown): string[] | undefined {
  const ids = asStringList(asRecord(file)?.[EDGE_TABLE_FIELD]);
  return ids.length ? ids : undefined;
}

export function asEdgeList(value: unknown, ids?: string[]): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      if (item) out.push(item);
      continue;
    }
    if (typeof item === 'number' && Number.isInteger(item)) {
      const ref = ids?.[item];
      if (ref) out.push(ref);
    }
  }
  return out;
}

export function resolveEdgeRows(
  map: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const ids = asIdTable(map);
  const out: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(map)) {
    if (key === EDGE_TABLE_FIELD) continue;
    const row = asRecord(value);
    if (!row) continue;
    if (ids) {
      if (Array.isArray(row.usedBy)) row.usedBy = asEdgeList(row.usedBy, ids);
      if (Array.isArray(row.producedBy)) row.producedBy = asEdgeList(row.producedBy, ids);
    }
    out[key] = row;
  }
  return out;
}

export function asStringMap(value: unknown): Record<string, string> | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(row)) {
    if (typeof item === 'string') out[key] = item;
  }
  return out;
}

