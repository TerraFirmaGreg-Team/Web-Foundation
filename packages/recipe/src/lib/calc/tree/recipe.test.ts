import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveRecipeAmount } from './recipe';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';

const FLUID_BODY = {
  id: 'gtceu:distillery/distill_oil',
  type: 'gtceu:distillery',
  category: 'gtceu:distillery',
  modId: 'gtceu',
  slots: {},
  properties: {},
  inputs: [
    { kind: 'fluid', id: 'gtceu:oil', count: 100 },
  ],
  outputs: [
    { kind: 'fluid', id: 'gtceu:sulfuric_gas', count: 1000 },
    { kind: 'item', id: 'gtceu:sulfur_dust', count: 1 },
  ],
  widgets: [],
  bodyUrl: '',
  extra: {},
} as Recipe;

test('fluid output amount comes from the loaded body, not the hint', async () => {
  const amount = await resolveRecipeAmount(
    'gtceu:distillery/distill_oil',
    'gtceu:sulfuric_gas',
    'fluid',
    async () => FLUID_BODY,
    1,
  );
  assert.equal(amount, 1000);
});

test('item output in a mixed recipe resolves by kind', async () => {
  const amount = await resolveRecipeAmount(
    'gtceu:distillery/distill_oil',
    'gtceu:sulfur_dust',
    'item',
    async () => FLUID_BODY,
    1,
  );
  assert.equal(amount, 1);
});

test('missing body falls back to the hint', async () => {
  const amount = await resolveRecipeAmount(
    'gtceu:gone',
    'gtceu:sulfuric_gas',
    'fluid',
    async () => undefined,
    1,
  );
  assert.equal(amount, 1);
});

test('body without the material falls back to the hint', async () => {
  const amount = await resolveRecipeAmount(
    'gtceu:distillery/distill_oil',
    'minecraft:diamond',
    'item',
    async () => FLUID_BODY,
    1,
  );
  assert.equal(amount, 1);
});

test('NBT-carrying output matches the base material id', async () => {
  const body = {
    ...FLUID_BODY,
    outputs: [
      {
        kind: 'item',
        id: 'gtceu:duranium_hammer{"Damage":0,"GT.Tool":{}}',
        count: 1,
      },
    ],
  } as Recipe;
  const amount = await resolveRecipeAmount(
    'gtceu:shaped/hammer_duranium',
    'gtceu:duranium_hammer',
    'item',
    async () => body,
    1,
  );
  assert.equal(amount, 1);
});
