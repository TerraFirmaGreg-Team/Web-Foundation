import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dumpTextLines } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { parseDecorWidgets } from '@terrafirmagreg-team/recipe/lib/data/parse/widgets';

const LANG = {
  'tfg.emi.fluid_veins.biomes': 'Биомы:',
  'tfg.emi.fluid_veins.yield_range': 'Выход: %s-%s',
};

test('parseDecorWidgets keeps tooltipComponents next to plain tooltip', () => {
  const [widget] = parseDecorWidgets([
    {
      type: 'text',
      x: 8,
      y: 126,
      w: 22,
      h: 9,
      text: '··· +8',
      tooltip: ['Coastal Dunes, Shore'],
      tooltipComponents: [
        { translate: 'tfg.emi.fluid_veins.biomes' },
        { text: '§7Coastal Dunes' },
      ],
    },
  ]);
  assert.equal(widget?.type, 'text');
  if (widget?.type !== 'text') return;
  assert.equal(widget.tooltip?.[0], 'Coastal Dunes, Shore');
  assert.equal(widget?.tooltipComponents?.length, 2);
  assert.equal(
    widget?.tooltipComponents?.[0]?.translate,
    'tfg.emi.fluid_veins.biomes',
  );
});

test('dumpTextLines resolves translate keys from lang map', () => {
  const lines = dumpTextLines(LANG, [
    { translate: 'tfg.emi.fluid_veins.biomes' },
    {
      translate: 'tfg.emi.fluid_veins.yield_range',
      with: [{ text: '100' }, { text: '200' }],
    },
    { text: '§7plain' },
  ]);
  assert.deepEqual(lines, ['Биомы:', 'Выход: 100-200', '§7plain']);
});

test('dumpTextLines leaves untranslated keys empty like the card fallback', () => {
  assert.deepEqual(dumpTextLines({}, [{ translate: 'missing.key' }]), ['']);
});
