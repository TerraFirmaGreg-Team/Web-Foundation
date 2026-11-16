import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rowMatchesTerms, rowSearchTerms } from './row-search';
import type { RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';

const ROW: RecipeCompactRow = {
  id: 'gtceu:lathe/lathe_amethyst_to_rod',
  type: 0,
  in: ['gtceu:amethyst_gem'],
  out: ['gtceu:amethyst_rod'],
};

const NAMES: Record<string, string> = {
  'gtceu:amethyst_gem': 'Amethyst Gem',
  'gtceu:amethyst_rod': 'Amethyst Rod',
};
const nameOf = (id: string) => NAMES[id];

test('rowSearchTerms splits on |, trims, lowercases, drops empties', () => {
  assert.deepEqual(rowSearchTerms(''), []);
  assert.deepEqual(rowSearchTerms('rod'), ['rod']);
  assert.deepEqual(rowSearchTerms('Rod | RUBY '), ['rod', 'ruby']);
  assert.deepEqual(rowSearchTerms('a||b'), ['a', 'b']);
  assert.deepEqual(rowSearchTerms('|'), []);
});

test('rowMatchesTerms passes everything without terms', () => {
  assert.equal(rowMatchesTerms(ROW, [], nameOf), true);
});

test('rowMatchesTerms matches input and output ids', () => {
  assert.equal(rowMatchesTerms(ROW, ['amethyst_gem'], nameOf), true);
  assert.equal(rowMatchesTerms(ROW, ['rod'], nameOf), true);
  assert.equal(rowMatchesTerms(ROW, ['ingot'], nameOf), false);
});

test('rowMatchesTerms matches localized names via nameOf', () => {
  assert.equal(rowMatchesTerms(ROW, ['amethyst rod'], nameOf), true);
  assert.equal(rowMatchesTerms(ROW, ['gem'], nameOf), true);
});

test('rowMatchesTerms ORs terms across inputs and outputs', () => {
  assert.equal(rowMatchesTerms(ROW, rowSearchTerms('copper|gem'), nameOf), true);
  assert.equal(
    rowMatchesTerms(ROW, rowSearchTerms('copper|iron'), nameOf),
    false,
  );
});

test('rowMatchesTerms tolerates names missing from the map', () => {
  const noName = () => undefined;
  assert.equal(rowMatchesTerms(ROW, ['rod'], noName), true);
  assert.equal(rowMatchesTerms(ROW, ['amethyst rod'], noName), false);
  assert.equal(rowMatchesTerms(ROW, ['amethyst rod'], nameOf), true);
});
