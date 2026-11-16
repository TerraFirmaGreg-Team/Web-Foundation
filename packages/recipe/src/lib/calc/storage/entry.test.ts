import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isCalcState, migrateCalcState } from './entry';
import type {
  CalcCard,
  CalculatorState,
} from '@terrafirmagreg-team/recipe/types/calc';

const CARDS: CalcCard[] = [
  { id: 'c1', materialId: 'gtceu:copper', kind: 'item', recipeId: null, crafts: 1 },
  { id: 'c2', materialId: 'gtceu:tin', kind: 'item', recipeId: null, crafts: 1 },
];

test('isCalcState accepts canonical pipes', () => {
  assert.equal(
    isCalcState({
      cards: CARDS,
      pipes: [{ from: 'c1', to: 'c2', input: 0 }],
      tagSelections: {},
    }),
    true,
  );
});

test('isCalcState accepts legacy wires', () => {
  assert.equal(
    isCalcState({
      cards: CARDS,
      wires: [{ from: 'c1', to: 'c2', input: 0 }],
      tagSelections: {},
    }),
    true,
  );
});

test('isCalcState rejects a state without pipes or wires', () => {
  assert.equal(
    isCalcState({ cards: CARDS, tagSelections: {} }),
    false,
  );
});

test('migrateCalcState normalizes legacy wires into pipes', () => {
  const migrated = migrateCalcState({
    cards: CARDS,
    wires: [
      { from: 'c1', to: 'c2', input: 0, amount: 8 },
      { from: 'c2', to: 'ghost', input: 0 },
    ],
    tagSelections: {},
  } as unknown as CalculatorState);
  assert.deepEqual(migrated.pipes, [
    { from: 'c1', to: 'c2', input: 0, amount: 8 },
  ]);
  assert.equal((migrated as { wires?: unknown }).wires, undefined);
});

test('migrateCalcState keeps canonical pipes', () => {
  const migrated = migrateCalcState({
    cards: CARDS,
    pipes: [{ from: 'c1', to: 'c2', input: 3 }],
    tagSelections: {},
    notes: [],
  });
  assert.deepEqual(migrated.pipes, [{ from: 'c1', to: 'c2', input: 3 }]);
});
