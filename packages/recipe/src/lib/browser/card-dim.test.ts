import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  recipeCardDim,
  recipeCardFitDim,
} from '@terrafirmagreg-team/recipe/lib/browser/card-dim';

const ROW = { d: { w: 320, h: 170 }, type: 0, id: 'a:b', out: [], in: [] };

test('recipeCardDim returns declared dims', () => {
  assert.deepEqual(recipeCardDim(null, new Map(), ROW as never), {
    w: 320,
    h: 170,
  });
});

test('recipeCardFitDim keeps dims when the card fits the box', () => {
  const d = recipeCardFitDim(null, new Map(), ROW as never, {
    w: 800,
    h: 600,
  });
  assert.deepEqual(d, { w: 320, h: 170 });
});

test('recipeCardFitDim scales uniformly when wider than the box', () => {
  const d = recipeCardFitDim(null, new Map(), ROW as never, {
    w: 160,
    h: 600,
  });
  assert.deepEqual(d, { w: 160, h: 85 });
});

test('recipeCardFitDim caps height to the box', () => {
  const d = recipeCardFitDim(null, new Map(), ROW as never, {
    w: 800,
    h: 100,
  });
  assert.deepEqual(d, { w: 320, h: 100 });
});
