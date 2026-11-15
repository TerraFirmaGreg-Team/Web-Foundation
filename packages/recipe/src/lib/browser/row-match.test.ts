import assert from 'node:assert/strict';
import { test } from 'node:test';
import { refsMatchBase } from './row-match';

const NBT_OUT = 'gtceu:duranium_hammer{"Damage":0,"GT.Tool":{}}';
const NBT_IN = 'gtceu:duranium_hammer{"Damage":10239,"GT.Tool":{}}';

test('NBT-carrying refs match the queried base id', () => {
  assert.equal(
    refsMatchBase([NBT_OUT, 'minecraft:amethyst_shard'], 'gtceu:duranium_hammer'),
    true,
  );
  assert.equal(
    refsMatchBase([NBT_IN], 'gtceu:duranium_hammer'),
    true,
  );
});

test('base, plain and unrelated ids behave as expected', () => {
  assert.equal(
    refsMatchBase(['gtceu:duranium_hammer'], 'gtceu:duranium_hammer'),
    true,
  );
  assert.equal(
    refsMatchBase([NBT_OUT], 'gtceu:copper_hammer'),
    false,
  );
  assert.equal(
    refsMatchBase(['#forge:tools/hammers'], 'gtceu:duranium_hammer'),
    false,
  );
  assert.equal(refsMatchBase([], 'gtceu:duranium_hammer'), false);
  assert.equal(refsMatchBase(undefined, 'gtceu:duranium_hammer'), false);
});
