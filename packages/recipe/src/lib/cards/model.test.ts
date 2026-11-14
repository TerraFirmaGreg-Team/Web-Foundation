import assert from 'node:assert/strict';
import { test } from 'node:test';
import { widgetTextColor } from '@terrafirmagreg-team/recipe/lib/cards/model';

test('widgetTextColor defaults uncolored shadowed text to white', () => {
  assert.equal(widgetTextColor(undefined, true), 0xffffff);
});

test('widgetTextColor defaults uncolored unshadowed text to black', () => {
  assert.equal(widgetTextColor(undefined, false), 0x000000);
});

test('widgetTextColor keeps explicit colors', () => {
  assert.equal(widgetTextColor(0xffffff, false), 0xffffff);
  assert.equal(widgetTextColor(0xff0000, true), 0xff0000);
  assert.equal(widgetTextColor(0, false), 0);
});

test('widgetTextColor masks color to 24 bits', () => {
  assert.equal(widgetTextColor(0x1ff0000, true), 0xff0000);
});
