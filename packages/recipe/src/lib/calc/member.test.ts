import assert from 'node:assert/strict';
import test from 'node:test';
import type { Recipe, RecipeSlotWidget } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { CalcNode } from '@terrafirmagreg-team/recipe/types/calc';
import { pinnedRecipe } from './member';

function tagSlot(over: Partial<RecipeSlotWidget> = {}): RecipeSlotWidget {
  return {
    type: 'slot',
    x: 0,
    y: 0,
    w: 16,
    h: 16,
    role: 'input',
    kind: 'tag',
    id: 'forge:rods/amethyst',
    alternatives: ['minecraft:amethyst_shard', 'gtceu:amethyst_rod'],
    ...over,
  };
}

function recipe(widgets: Recipe['widgets']): Recipe {
  return {
    id: 'gtceu:lathe/lathe_amethyst_to_rod',
    type: 'gtceu:lathe',
    category: 'gtceu:lathe',
    modId: 'gtceu',
    slots: {},
    properties: {},
    inputs: [],
    outputs: [],
    widgets,
    bodyUrl: '',
    extra: {},
  } as Recipe;
}

function node(inputs: CalcNode['inputs']): CalcNode {
  return {
    id: 'n1',
    materialId: 'gtceu:amethyst_rod',
    kind: 'item',
    crafts: 1,
    produced: 2,
    allocated: 0,
    remaining: 2,
    outputs: [],
    recipe: null,
    inputs,
    availableRecipes: [],
    cycle: false,
    products: false,
  };
}

test('pinnedRecipe pins a tag slot to the selected member', () => {
  const src = recipe([tagSlot()]);
  const target = node([
    {
      id: 'gtceu:amethyst_rod',
      kind: 'item',
      amount: 1,
      catalyst: false,
      tagId: 'forge:rods/amethyst',
      members: ['minecraft:amethyst_shard', 'gtceu:amethyst_rod'],
      wired: false,
      covered: 0,
    },
  ]);
  const out = pinnedRecipe(src, target, {
    'forge:rods/amethyst': 'gtceu:amethyst_rod',
  });
  const slot = out.widgets[0] as RecipeSlotWidget;
  assert.deepEqual(slot.alternatives, ['gtceu:amethyst_rod']);
});

test('pinnedRecipe matches hash-prefixed selections and widget ids', () => {
  const src = recipe([tagSlot({ id: '#forge:rods/amethyst' })]);
  const target = node([
    {
      id: 'gtceu:amethyst_rod',
      kind: 'item',
      amount: 1,
      catalyst: false,
      tagId: '#forge:rods/amethyst',
      wired: false,
      covered: 0,
    },
  ]);
  const out = pinnedRecipe(src, target, {
    'forge:rods/amethyst': 'gtceu:amethyst_rod',
  });
  const slot = out.widgets[0] as RecipeSlotWidget;
  assert.deepEqual(slot.alternatives, ['gtceu:amethyst_rod']);
});

test('pinnedRecipe keeps cycling when no selection exists', () => {
  const src = recipe([tagSlot()]);
  const target = node([
    {
      id: 'minecraft:amethyst_shard',
      kind: 'item',
      amount: 1,
      catalyst: false,
      tagId: 'forge:rods/amethyst',
      members: ['minecraft:amethyst_shard', 'gtceu:amethyst_rod'],
      wired: false,
      covered: 0,
    },
  ]);
  const out = pinnedRecipe(src, target, {});
  assert.equal(out, src);
});

test('pinnedRecipe matches members by base id against NBT alternatives', () => {
  const src = recipe([
    tagSlot({
      id: '#forge:tools/hammers',
      alternatives: [
        'gtceu:stone_hammer{Damage:0,GT.Tool:{}}',
        'gtceu:copper_hammer{Damage:0,GT.Tool:{}}',
      ],
    }),
  ]);
  const target = node([
    {
      id: 'gtceu:copper_hammer',
      kind: 'item',
      amount: 1,
      catalyst: false,
      tagId: '#forge:tools/hammers',
      wired: false,
      covered: 0,
    },
  ]);
  const out = pinnedRecipe(src, target, {
    'forge:tools/hammers': 'gtceu:copper_hammer',
  });
  const slot = out.widgets[0] as RecipeSlotWidget;
  assert.deepEqual(slot.alternatives, [
    'gtceu:copper_hammer{Damage:0,GT.Tool:{}}',
  ]);
});

test('pinnedRecipe pins the picked member outside alternatives and skips non-tag widgets', () => {
  const src = recipe([
    tagSlot(),
    {
      type: 'slot',
      x: 0,
      y: 0,
      w: 16,
      h: 16,
      role: 'input',
      kind: 'item',
      id: 'minecraft:stick',
    },
  ]);
  const target = node([
    {
      id: 'minecraft:planks',
      kind: 'item',
      amount: 1,
      catalyst: false,
      tagId: 'forge:rods/amethyst',
      wired: false,
      covered: 0,
    },
  ]);
  const out = pinnedRecipe(src, target, {
    'forge:rods/amethyst': 'minecraft:planks',
  });
  const tag = out.widgets[0] as RecipeSlotWidget;
  const item = out.widgets[1] as RecipeSlotWidget;
  assert.deepEqual(tag.alternatives, ['minecraft:planks']);
  assert.equal(item.id, 'minecraft:stick');
  assert.equal(item.alternatives, undefined);
});
