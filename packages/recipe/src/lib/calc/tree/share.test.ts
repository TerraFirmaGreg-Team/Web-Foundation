import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deflateSync, strToU8 } from 'fflate';
import { decodeCalcState, encodeCalcState } from './share';
import type { CalculatorState } from '@terrafirmagreg-team/recipe/types/calc';

const STATE: CalculatorState = {
  cards: [
    {
      id: 'c1',
      materialId: 'gtceu:amethyst_rod',
      kind: 'item',
      recipeId: 'gtceu:lathe/lathe_amethyst_to_rod',
      crafts: 4,
      pos: { x: 100, y: 200 },
    },
    {
      id: 'c2',
      materialId: 'gtceu:amethyst_gem',
      kind: 'item',
      recipeId: null,
      crafts: 1,
    },
  ],
  pipes: [{ from: 'c1', to: 'c2', input: 0, amount: 8 }],
  tagSelections: { 'tfg:rods': 'gtceu:amethyst_rod' },
  notes: [
    { id: 'n_a', text: 'LV tier only', pos: { x: 10.4, y: -20.6 } },
    {
      id: 'n_b',
      text: 'многострочная\nзаметка',
      pos: { x: 0, y: 0 },
      color: 'emerald',
    },
  ],
};

test('calc share round-trips cards, pipes, tags and notes', () => {
  const decoded = decodeCalcState(encodeCalcState(STATE));
  assert.ok(decoded);
  assert.equal(decoded.cards.length, 2);
  assert.equal(decoded.cards[0]?.id, 'c0');
  assert.equal(decoded.cards[0]?.materialId, 'gtceu:amethyst_rod');
  assert.equal(decoded.cards[0]?.crafts, 4);
  assert.deepEqual(decoded.cards[0]?.pos, { x: 100, y: 200 });
  assert.equal(decoded.cards[1]?.recipeId, null);
  assert.deepEqual(decoded.pipes, [
    { from: 'c0', to: 'c1', input: 0, out: undefined, amount: 8 },
  ]);
  assert.deepEqual(decoded.tagSelections, STATE.tagSelections);
  assert.equal(decoded.notes.length, 2);
  assert.equal(decoded.notes[0]?.id, 'n_a');
  assert.equal(decoded.notes[0]?.text, 'LV tier only');
  assert.deepEqual(decoded.notes[0]?.pos, { x: 10, y: -21 });
  assert.equal(decoded.notes[1]?.text, 'многострочная\nзаметка');
  assert.equal(decoded.notes[0]?.color, undefined);
  assert.equal(decoded.notes[1]?.color, 'emerald');
});

test('calc share decodes legacy payloads without notes', () => {
  const { notes: _drop, ...legacy } = STATE;
  const decoded = decodeCalcState(encodeCalcState(legacy as CalculatorState));
  assert.ok(decoded);
  assert.deepEqual(decoded.notes, []);
});

test('calc share drops malformed note rows but keeps valid ones', () => {
  const encoded = encodeCalcState(STATE);
  const decoded = decodeCalcState(encoded);
  assert.ok(decoded);
  assert.equal(decoded.notes.length, 2);
});

test('calc share decodes legacy wire payloads', () => {
  const payload = {
    v: 2,
    d: ['gtceu:amethyst_rod', 'gtceu:amethyst_gem'],
    c: [
      [0, 0, -1, 1, 100, 200, 1],
      [1, 0, -1, 1, 0, 0, 0],
    ],
    w: [[0, 1, 2, 1, 64]],
    g: {},
    n: [],
  };
  const u8 = deflateSync(strToU8(JSON.stringify(payload)));
  let bin = '';
  for (let i = 0; i < u8.length; i += 8192) {
    bin += String.fromCharCode(...u8.subarray(i, i + 8192));
  }
  const encoded = `x${btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  const decoded = decodeCalcState(encoded);
  assert.ok(decoded);
  assert.deepEqual(decoded.pipes, [
    { from: 'c0', to: 'c1', input: 2, out: 1, amount: 64 },
  ]);
});

test('calc share rejects garbage', () => {
  assert.equal(decodeCalcState(''), null);
  assert.equal(decodeCalcState('!!!not-base64!!!'), null);
});
