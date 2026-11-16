import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pipeEndMatches } from './pipe';
import type { CalcNodeInput } from '@terrafirmagreg-team/recipe/types/calc';

const NBT = '{"Damage":0,"GT.Tool":{}}';

test('NBT input id matches a base output id', () => {
  const input = {
    id: `gtceu:duranium_hammer${NBT}`,
    kind: 'item',
    amount: 1,
    catalyst: false,
  } as CalcNodeInput;
  assert.equal(
    pipeEndMatches(input, {
      id: 'gtceu:duranium_hammer',
      kind: 'item',
      amount: 1,
    }),
    true,
  );
});

test('tag members carrying NBT match a base output id', () => {
  const input = {
    id: 'gtceu:copper_hammer',
    kind: 'item',
    amount: 1,
    catalyst: false,
    tagId: '#forge:tools/hammers',
    members: [
      `gtceu:copper_hammer${NBT}`,
      `gtceu:duranium_hammer${NBT}`,
    ],
  } as CalcNodeInput;
  assert.equal(
    pipeEndMatches(input, {
      id: 'gtceu:duranium_hammer',
      kind: 'item',
      amount: 1,
    }),
    true,
  );
});

test('kind mismatch and unrelated ids still fail', () => {
  const input = {
    id: 'gtceu:duranium_hammer',
    kind: 'item',
    amount: 1,
    catalyst: false,
  } as CalcNodeInput;
  assert.equal(
    pipeEndMatches(input, {
      id: 'gtceu:duranium_hammer',
      kind: 'fluid',
      amount: 1,
    }),
    false,
  );
  assert.equal(
    pipeEndMatches(input, {
      id: 'gtceu:copper_hammer',
      kind: 'item',
      amount: 1,
    }),
    false,
  );
});
