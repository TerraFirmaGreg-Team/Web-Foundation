import type { CalculatorState } from '@terrafirmagreg-team/recipe/types/calc';

const MAX_HISTORY = 5;

export type CalcTreeEntry = {
  id: string;

  name?: string;

  icon?: { id: string; kind: 'item' | 'fluid' };
  savedAt: number;
  state: CalculatorState;
};

export const EMPTY_ENTRIES: CalcTreeEntry[] = [];

export function newCalcEntry(state: CalculatorState, name?: string): CalcTreeEntry {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    savedAt: Date.now(),
    state,
  };
}

const isCardRow = (row: unknown): boolean =>
  !!row &&
  typeof row === 'object' &&
  typeof (row as { id?: unknown }).id === 'string' &&
  typeof (row as { materialId?: unknown }).materialId === 'string' &&
  ((row as { kind?: unknown }).kind === 'item' ||
    (row as { kind?: unknown }).kind === 'fluid');

const isWireRow = (row: unknown): boolean =>
  !!row &&
  typeof row === 'object' &&
  typeof (row as { from?: unknown }).from === 'string' &&
  typeof (row as { to?: unknown }).to === 'string' &&
  typeof (row as { input?: unknown }).input === 'number';

export function isCalcState(value: unknown): value is CalculatorState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    Array.isArray(row.cards) &&
    row.cards.every(isCardRow) &&
    Array.isArray(row.wires) &&
    row.wires.every(isWireRow) &&
    !!row.tagSelections &&
    typeof row.tagSelections === 'object'
  );
}

export function migrateCalcState(state: CalculatorState): CalculatorState {
  const cards = Array.isArray(state.cards) ? state.cards.filter(isCardRow) : [];
  const ids = new Set(cards.map((card) => card.id));
  return {
    cards,
    wires: (Array.isArray(state.wires) ? state.wires.filter(isWireRow) : []).filter(
      (wire) => ids.has(wire.from) && ids.has(wire.to),
    ),
    tagSelections: state.tagSelections,
  };
}

function isEntry(value: unknown): value is CalcTreeEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  const icon = row.icon as Record<string, unknown> | undefined;
  return (
    typeof row.id === 'string' &&
    typeof row.savedAt === 'number' &&
    isCalcState(row.state) &&
    (icon === undefined ||
      (typeof icon === 'object' &&
        icon !== null &&
        typeof icon.id === 'string' &&
        (icon.kind === 'item' || icon.kind === 'fluid')))
  );
}

export const isCalcTabs = (v: unknown): v is CalcTreeEntry[] =>
  Array.isArray(v) && v.every(isEntry);
export const isCalcHistory = isCalcTabs;

export function capHistory(entries: CalcTreeEntry[]): CalcTreeEntry[] {
  const seen = new Set<string>();
  const out: CalcTreeEntry[] = [];
  for (const entry of [...entries].sort((a, b) => b.savedAt - a.savedAt)) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

