import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countCoveredText,
  slotCoveredLabel,
  widgetTextColor,
} from '@terrafirmagreg-team/recipe/lib/cards/model';
import type {
  RecipeSlotWidget,
  RecipeTextWidget,
} from '@terrafirmagreg-team/recipe/lib/data/dto';

const slot = (over: Partial<RecipeSlotWidget>): RecipeSlotWidget => ({
  type: 'slot',
  x: 49,
  y: 133,
  w: 16,
  h: 16,
  role: 'renderOnly',
  kind: 'item',
  id: 'gtceu:bronze_block',
  ...over,
});

const textWidget = (over: Partial<RecipeTextWidget>): RecipeTextWidget => ({
  type: 'text',
  x: 54,
  y: 142,
  w: 12,
  h: 9,
  text: '',
  ...over,
});

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

test('countCoveredText suppresses a count text overlapping its slot', () => {
  const slots = [slot({ count: 24 })];
  assert.equal(countCoveredText(textWidget({ text: '24' }), slots), true);
  assert.equal(countCoveredText(textWidget({ text: 'x2' }), slots), false);
});

test('countCoveredText suppresses a component-carried count', () => {
  const slots = [slot({ count: 24 })];
  const widget = textWidget({ component: { text: '24' } });
  assert.equal(countCoveredText(widget, slots), true);
});

test('countCoveredText ignores component text that is not a count', () => {
  const slots = [slot({ count: 24 })];
  const widget = textWidget({ component: { text: 'Bronze Tank' } });
  assert.equal(countCoveredText(widget, slots), false);
});

test('countCoveredText requires overlap with the counted slot', () => {
  const slots = [slot({ count: 24 })];
  const widget = textWidget({ x: 200, component: { text: '24' } });
  assert.equal(countCoveredText(widget, slots), false);
});

test('slotCoveredLabel anchors a component-carried NC label', () => {
  const target = slot({});
  const widget = textWidget({ x: 50, component: { text: 'NC' } });
  assert.equal(slotCoveredLabel(widget, [target]), target);
});
