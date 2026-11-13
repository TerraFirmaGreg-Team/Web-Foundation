import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import type { PreparedCatalog } from '../../types/catalog';
import { parseCatalogLabels, parsePreparedCatalog } from './prepared-catalog';

const catalog: PreparedCatalog = {
  items: ['test:item{mode:1}'],
  fluids: [],
  usedIds: ['#test:ores'],
  tabs: [{ id: 'test:tab', order: 0, display: {} }],
  tabItems: { 'test:tab': ['test:item{mode:1}'] },
  categories: [{ id: 'test:craft', order: 0, workstations: [] }],
  groups: [{ id: 'test:group', members: ['test:item{mode:1}'] }],
};
const requests: string[] = [];
const names = { 'test:item{mode:1}': 'Item' };

mock.module('@terrafirmagreg-team/dump/lib/dump/client/dump', {
  namedExports: {
    clientDumpJson: async (_dataset: DatasetRef, path: string) => {
      requests.push(path);
      if (path === 'registry/catalog.json') return catalog;
      if (path === 'lang/fr_fr.catalog.json') {
        return { mods: { test: 'Test' }, names: { 'test:tab': 'Outils' }, groups: { 'test:group': 'Groupe' } };
      }
      if (path === 'lang/en_us.catalog.json') {
        return { mods: { test: 'Test' }, names: { 'test:tab': 'Tools' }, groups: { 'test:group': 'Group' } };
      }
      throw new Error(`Unexpected request ${path}`);
    },
    clientDumpNames: async (_dataset: DatasetRef, lang: string) => {
      requests.push(`names/${lang}.ndjson`);
      return names;
    },
  },
});
mock.module('@terrafirmagreg-team/dump/lib/dump/reader', {
  namedExports: {
    createDatasetCache: <A extends unknown[], V>(
      loader: (dataset: DatasetRef, ...args: A) => Promise<V>,
      key = (dataset: DatasetRef, ...args: A) => datasetCacheKey(dataset, ...args),
    ) => createAsyncCache(loader, key),
  },
});

test('chrome requests only prepared projections and shares neutral arrays across locales', async () => {
  const { loadRecipeChromeClient, loadRecipeEntityNames } = await import('./chrome');
  const dataset = { id: 'fixture', version: '1', revision: 'a' };
  const en = await loadRecipeChromeClient(dataset, 'en_us');
  assert.deepEqual(requests, ['registry/catalog.json', 'lang/en_us.catalog.json']);
  assert.equal(en.items, catalog.items);
  assert.equal(en.names.en_us['test:tab'], 'Tools');
  assert.equal(en.groups?.[0].name, 'Group');
  const fr = await loadRecipeChromeClient(dataset, 'fr_fr');
  assert.deepEqual(requests, [
    'registry/catalog.json', 'lang/en_us.catalog.json', 'lang/fr_fr.catalog.json',
  ]);
  assert.equal(fr.items, en.items);
  assert.equal(fr.fluids, en.fluids);
  assert.equal(fr.usedIds, en.usedIds);
  assert.equal(fr.tabs, en.tabs);
  assert.equal(fr.categories, en.categories);
  assert.equal(fr.tabItems, en.tabItems);
  assert.equal(fr.groups?.[0].members, en.groups?.[0].members);
  assert.equal(fr.groups?.[0].name, 'Groupe');
  assert.equal(await loadRecipeChromeClient(dataset, 'en_us'), en);
  assert.equal(await loadRecipeEntityNames(dataset, en, 'en_us'), names);
  assert.equal(await loadRecipeEntityNames(dataset, fr, 'en_us'), names);
  assert.equal(requests.filter((path) => path.startsWith('names/')).length, 1);
});

test('required projections reject missing fields, old shapes and malformed rows', () => {
  assert.throws(() => parsePreparedCatalog(undefined));
  for (const field of Object.keys(catalog)) {
    const invalid: Record<string, unknown> = { ...catalog };
    delete invalid[field];
    assert.throws(() => parsePreparedCatalog(invalid));
  }
  assert.throws(() => parsePreparedCatalog({ ...catalog, tabs: {} }));
  assert.throws(() => parsePreparedCatalog({ ...catalog, categories: [{ id: 'test:craft' }] }));
  assert.throws(() => parseCatalogLabels({ mods: {}, names: {} }));
  assert.throws(() => parseCatalogLabels({ mods: {}, names: {}, groups: { bad: 1 } }));
  const empty = { items: [], fluids: [], usedIds: [], tabs: [], tabItems: {}, categories: [], groups: [] };
  assert.deepEqual(parsePreparedCatalog(empty), empty);
});
