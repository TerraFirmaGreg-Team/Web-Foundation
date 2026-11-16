import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildScheme, type SchemeContext } from './scheme';
import { memberTarget } from './member';
import type { CalcCard, CalcRecipe } from '@terrafirmagreg-team/recipe/types/calc';

const RODS = [
  'gtceu:amethyst_rod',
  'gtceu:opal_rod',
  'gtceu:ruby_rod',
];
const TAG = 'tfg:precision_fabricator_holder_rods';

const RECIPE: CalcRecipe = {
  recipeId: 'gtceu:high_temperature_precision_fabricator/x',
  category: 'gtceu:high_temperature_precision_fabricator',
  inputs: [
    { id: 'tfg:ingot', kind: 'item', amount: 1, catalyst: false },
    {
      id: TAG,
      kind: 'item',
      amount: 1,
      catalyst: false,
      tagId: TAG,
    },
  ],
  outputs: [{ id: 'tfg:tipped_ingot', kind: 'item', amount: 1 }],
};

const CARD: CalcCard = {
  id: 'c1',
  materialId: 'tfg:tipped_ingot',
  kind: 'item',
  recipeId: RECIPE.recipeId,
  crafts: 1,
};

function ctx(tagSelections: Record<string, string>): SchemeContext {
  return {
    recipeMap: new Map([[RECIPE.recipeId, RECIPE]]),
    getRecipesForItem: () => [],
    tagMembers: (tagId) =>
      tagId === TAG || tagId === `#${TAG}`
        ? { members: RODS, kind: 'item' }
        : undefined,
    tagSelections,
    recipesResolved: () => true,
    deadIds: new Set(),
  };
}

function tagInput(tagSelections: Record<string, string>) {
  const { nodes } = buildScheme({ cards: [CARD], pipes: [], ctx: ctx(tagSelections) });
  const node = nodes[0];
  return node?.inputs[1];
}

test('tag input resolves to first member and keeps members for picking', () => {
  const input = tagInput({});
  assert.equal(input?.id, 'gtceu:amethyst_rod');
  assert.equal(input?.tagId, TAG);
  assert.deepEqual(input?.members, RODS);
});

test('tag input honors member selection for its tagId', () => {
  const input = tagInput({ [TAG]: 'gtceu:ruby_rod' });
  assert.equal(input?.id, 'gtceu:ruby_rod');
});

test('tag input honors selection written under the #-prefixed card tagId', () => {
  const input = tagInput({ [`#${TAG}`]: 'gtceu:opal_rod' });
  assert.equal(input?.id, 'gtceu:opal_rod');
});

test('stale selection not in members falls back to first member', () => {
  const input = tagInput({ [TAG]: 'gtceu:removed_rod' });
  assert.equal(input?.id, 'gtceu:amethyst_rod');
});

const NBT_RODS = [
  'gtceu:amethyst_rod{Damage:0}',
  'gtceu:opal_rod{Damage:0}',
  'gtceu:ruby_rod{Damage:0}',
];

function nbtCtx(tagSelections: Record<string, string>): SchemeContext {
  return {
    ...ctx(tagSelections),
    tagMembers: (tagId) =>
      tagId === TAG || tagId === `#${TAG}`
        ? { members: NBT_RODS, kind: 'item' }
        : undefined,
  };
}

function nbtTagInput(tagSelections: Record<string, string>) {
  const { nodes } = buildScheme({
    cards: [CARD],
    pipes: [],
    ctx: nbtCtx(tagSelections),
  });
  return nodes[0]?.inputs[1];
}

test('tag input resolves a base-id selection against NBT members', () => {
  const input = nbtTagInput({ [TAG]: 'gtceu:ruby_rod' });
  assert.equal(input?.id, 'gtceu:ruby_rod');
});

test('tag input normalizes an NBT selection to its base id', () => {
  const input = nbtTagInput({ [TAG]: 'gtceu:opal_rod{Damage:0}' });
  assert.equal(input?.id, 'gtceu:opal_rod');
});

test('memberTarget marks the picked member on a tag card', () => {
  const { nodes } = buildScheme({
    cards: [{ ...CARD, id: 't1', materialId: `#${TAG}`, recipeId: null }],
    pipes: [],
    ctx: ctx({}),
  });
  const target = memberTarget(
    { node: nodes[0]! },
    { [`#${TAG}`]: 'gtceu:ruby_rod' },
  );
  assert.equal(target?.selected, 'gtceu:ruby_rod');
});

test('memberTarget resolves node-level tag cards', () => {
  const { nodes } = buildScheme({
    cards: [{ ...CARD, id: 't1', materialId: `#${TAG}`, recipeId: null }],
    pipes: [],
    ctx: ctx({}),
  });
  const target = memberTarget({ node: nodes[0]! });
  assert.equal(target?.tagId, `#${TAG}`);
  assert.deepEqual(target?.members, RODS);
  assert.equal(target?.selected, `#${TAG}`);
  assert.equal(target?.kind, 'item');
});

test('memberTarget resolves a tag input on a recipe node', () => {
  const { nodes } = buildScheme({ cards: [CARD], pipes: [], ctx: ctx({}) });
  const target = memberTarget({ node: nodes[0]!, input: 1 });
  assert.equal(target?.tagId, TAG);
  assert.deepEqual(target?.members, RODS);
  assert.equal(target?.selected, 'gtceu:amethyst_rod');
  assert.equal(target?.kind, 'item');
});

test('memberTarget is empty for plain inputs and missing slots', () => {
  const { nodes } = buildScheme({ cards: [CARD], pipes: [], ctx: ctx({}) });
  assert.equal(memberTarget({ node: nodes[0]!, input: 0 }), undefined);
  assert.equal(memberTarget({ node: nodes[0]!, input: 9 }), undefined);
});

const FLUID_RECIPE: CalcRecipe = {
  recipeId: 'gtceu:distiller/distill_oil',
  category: 'gtceu:distiller',
  inputs: [{ id: 'gtceu:oil', kind: 'fluid', amount: 100, catalyst: false }],
  outputs: [{ id: 'gtceu:sulfuric_gas', kind: 'fluid', amount: 50 }],
};

const CONSUME_RECIPE: CalcRecipe = {
  recipeId: 'gtceu:mixer/mix_gas',
  category: 'gtceu:mixer',
  inputs: [
    { id: 'gtceu:sulfuric_gas', kind: 'fluid', amount: 50, catalyst: false },
  ],
  outputs: [{ id: 'gtceu:mixed_gas', kind: 'fluid', amount: 60 }],
};

function fluidCtx(recipes: CalcRecipe[]): SchemeContext {
  return {
    recipeMap: new Map(recipes.map((r) => [r.recipeId, r])),
    getRecipesForItem: () => [],
    tagMembers: () => undefined,
    tagSelections: {},
    recipesResolved: () => true,
    deadIds: new Set(),
  };
}

test('fluid-only recipe produces its fluid output and feeds a consumer', () => {
  const { nodes, flows } = buildScheme({
    cards: [
      {
        id: 'src',
        materialId: 'gtceu:sulfuric_gas',
        kind: 'fluid',
        recipeId: FLUID_RECIPE.recipeId,
        crafts: 2,
      },
      {
        id: 'dst',
        materialId: 'gtceu:mixed_gas',
        kind: 'fluid',
        recipeId: CONSUME_RECIPE.recipeId,
        crafts: 1,
      },
    ],
    pipes: [{ from: 'src', to: 'dst', input: 0 }],
    ctx: fluidCtx([FLUID_RECIPE, CONSUME_RECIPE]),
  });
  const [src, dst] = nodes;
  assert.equal(src?.produced, 100);
  assert.equal(src?.outputs[0]?.id, 'gtceu:sulfuric_gas');
  assert.equal(src?.outputs[0]?.kind, 'fluid');
  assert.equal(src?.inputs[0]?.id, 'gtceu:oil');
  assert.equal(src?.inputs[0]?.amount, 200);
  assert.equal(dst?.inputs[0]?.covered, 50);
  assert.deepEqual(flows, [50]);
  assert.equal(src?.remaining, 50);
});
