import assert from 'node:assert/strict';
import test from 'node:test';
import { diverseTagMembers } from './tag-members';

test('diverseTagMembers interleaves members across path families', () => {
  const members = [
    'afc:wood/fallen_leaves/acacia',
    'afc:wood/fallen_leaves/birch',
    'afc:wood/fallen_leaves/cypress',
    'afc:wood/leaves/acacia',
    'tfc:plant/dandelion',
    'tfc:plant/allium',
  ];
  assert.deepEqual(diverseTagMembers(members, 16), [
    'afc:wood/fallen_leaves/acacia',
    'afc:wood/leaves/acacia',
    'tfc:plant/dandelion',
    'afc:wood/fallen_leaves/birch',
    'tfc:plant/allium',
    'afc:wood/fallen_leaves/cypress',
  ]);
});

test('diverseTagMembers treats single-segment paths as own family', () => {
  const members = ['betterend:aeridium', 'betterend:amber_grass'];
  assert.deepEqual(diverseTagMembers(members, 16), members);
});

test('diverseTagMembers keeps single-family members sequential', () => {
  const members = ['tfc:rock/mossy_bricks/a', 'tfc:rock/mossy_bricks/b'];
  assert.deepEqual(diverseTagMembers(members, 16), members);
});

test('diverseTagMembers caps output at the limit', () => {
  const members = Array.from({ length: 40 }, (_, i) => `a:b/c${i}`);
  const out = diverseTagMembers(members, 16);
  assert.equal(out.length, 16);
  assert.deepEqual(out, members.slice(0, 16));
});

test('diverseTagMembers mixes a leaf-heavy tag prefix', () => {
  const members = [
    ...Array.from(
      { length: 4 },
      (_, i) => `afc:wood/fallen_leaves/tree${i}`,
    ),
    ...Array.from({ length: 4 }, (_, i) => `afc:wood/leaves/tree${i}`),
    'betterend:aeridium',
    'betterend:amber_grass',
    'tfc:plant/dandelion',
    'tfc:plant/allium',
  ];
  const out = diverseTagMembers(members, 6);
  assert.deepEqual(out, [
    'afc:wood/fallen_leaves/tree0',
    'afc:wood/leaves/tree0',
    'betterend:aeridium',
    'betterend:amber_grass',
    'tfc:plant/dandelion',
    'afc:wood/fallen_leaves/tree1',
  ]);
});

test('diverseTagMembers returns empty for empty input', () => {
  assert.deepEqual(diverseTagMembers([], 16), []);
});
