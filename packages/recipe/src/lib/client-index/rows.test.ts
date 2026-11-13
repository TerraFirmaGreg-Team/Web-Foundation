import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { gzipSync } from 'node:zlib';
import type { DatasetSnapshot } from '@terrafirmagreg-team/sites/location';
import type { PreparedRecipeRow } from '@terrafirmagreg-team/dump/lib/dump/gen';
import type { SnapshotIndex } from '@terrafirmagreg-team/dump/types/snapshot';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import { clientRecipeFileRels, loadClientRecipe } from '../client/recipe';
import { loadCategoryRecipes, loadTypeRows, resolveRecipeRows } from './rows';

function fixture(t: TestContext, id: string) {
  process.env.NEXT_PUBLIC_DUMP_STORAGE_URL = 'https://recipe.invalid';
  const dataset: DatasetSnapshot = { id, version: '1', revision: 'a'.repeat(64) };
  const root = `${id}/1/revisions/${dataset.revision}`;
  const bucketA = 'data/r/recipes/a/craft/blocks/0.json';
  const bucketB = 'data/r/recipes/b/craft/blocks/0.json';
  const bucketNext = 'data/r/recipes/a/craft/blocks/1.json';
  const makeRow = (category: string, bucket: string, recipeId = 'r:shared', order = 0): PreparedRecipeRow => ({
    id: recipeId, category, bucket, order,
    inputs: ['r:input{"mode":1}', '#r:tag'], outputs: ['r:output'],
    image: 'r:image', w: 80, h: 40,
  });
  const a = makeRow('a:craft', bucketA);
  const b = makeRow('b:craft', bucketB);
  const duplicate = makeRow('a:craft', bucketNext, 'r:shared/dup_1', 1);
  const tag = makeRow('emi:tag', 'data/r/recipes/emi/tag/blocks/0.json');
  const types = [
    { id: 'a:craft', count: 2, rows: 'data/a/index/recipes/craft.json' },
    { id: 'b:craft', count: 1, rows: 'data/b/index/recipes/craft.json' },
    { id: 'emi:tag', count: 1, rows: 'data/emi/index/recipes/tag.json' },
  ];
  const body = (category: string) => ({ category, slots: {}, properties: {} });
  const documents: Record<string, unknown> = {
    'manifest.json': {
      schema: 'manifest', layout: 'v3', languages: [],
      producer: { name: 'fixture', platform: 'test', minecraft: 'test' },
      indexes: { quests: {}, recipes: { types }, used: [] },
      namespaces: {
        r: { display: { name: 'r' }, registry: ['recipes'], guides: [], languages: [], quests: false, keybinds: false },
      },
    },
    [types[0]!.rows]: { rows: [duplicate, a] },
    [types[1]!.rows]: { rows: [b] },
    [types[2]!.rows]: { rows: [tag] },
    'registry/recipes.ndjson': { 'r:shared': [a, b, tag], 'r:shared/dup_1': [duplicate] },
    [bucketA]: { 'r:shared': body('a:craft') },
    [bucketB]: { 'r:shared': body('b:craft') },
    [bucketNext]: { 'r:shared/dup_1': body('a:craft') },
  };
  const snapshot: SnapshotIndex = { files: {}, artifacts: {} };
  for (const path of Object.keys(documents)) {
    snapshot.files[path] = `${root}/${path}`;
    snapshot.artifacts[path] = {
      sha256: 'b'.repeat(64), bytes: 10, codec: path.endsWith('.ndjson') ? 'ndjson' : 'json', compression: 'none',
    };
  }
  const requests: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith('/versions.json')) {
      return Response.json({
        pack: id, latest: '1', versions: ['1'],
        snapshots: { '1': {
          revision: dataset.revision, publishedAt: '2026-01-01T00:00:00Z',
          index: `${root}/objects.json.gz`,
        } },
      });
    }
    if (url.endsWith('/objects.json.gz')) {
      return new Response(new Uint8Array(gzipSync(JSON.stringify(snapshot))));
    }
    const path = url.slice(`https://recipe.invalid/${root}/`.length);
    const document = documents[path];
    assert.notEqual(document, undefined, `Unexpected request: ${url}`);
    if (path.endsWith('.ndjson')) {
      return new Response(Object.entries(document as Record<string, unknown>)
        .map(([key, value]) => JSON.stringify({ [key]: value })).join('\n'));
    }
    return Response.json(document);
  });
  const index: RecipeCompactIndex = {
    types: ['b:craft', 'a:craft', 'emi:tag'], items: [], names: {},
  };
  return { dataset, index, requests, bucketA, bucketB, bucketNext };
}

test('type rows only read prepared metadata and preserve order and refs', async (t) => {
  const { dataset, index, requests, bucketA } = fixture(t, 'recipe-type');
  const rows = await loadTypeRows({ id: dataset.id }, index, 'a:craft');
  assert.deepEqual(rows.map((row) => row.id), ['r:shared', 'r:shared/dup_1']);
  assert.equal(rows[0]!.type, 1);
  assert.equal(rows[0]!.bucket, bucketA);
  assert.deepEqual(rows[0]!.in, ['r:input{"mode":1}', '#r:tag']);
  assert.deepEqual(rows[0]!.d, { w: 80, h: 40 });
  assert.ok(rows[0]!.bodyUrl?.endsWith(bucketA));
  const reordered = await loadTypeRows(dataset, { ...index, types: ['a:craft'] }, 'a:craft');
  assert.equal(reordered[0]!.type, 0);
  assert.equal(requests.filter((url) => url.includes('/blocks/')).length, 0);
  assert.equal(requests.filter((url) => url.endsWith('/registry/recipes.ndjson')).length, 0);
});

test('selected recipe reads only its block, and calculator can load all category blocks', async (t) => {
  const { dataset, index, requests, bucketA, bucketB, bucketNext } = fixture(t, 'recipe-body');
  const rows = await loadTypeRows(dataset, index, 'a:craft');
  const recipe = await loadClientRecipe(dataset, rows[0]!.id, rows[0]!.bucket);
  assert.equal(recipe?.type, 'a:craft');
  assert.deepEqual(requests.filter((url) => url.includes('/blocks/')).map((url) => url.split('/data/')[1]),
    [bucketA.slice(5)]);
  const category = await loadCategoryRecipes(dataset, index, 'a:craft');
  assert.deepEqual(category.map((entry) => entry.id), ['r:shared', 'r:shared/dup_1']);
  assert.ok(requests.some((url) => url.endsWith(bucketNext)));
  assert.ok(!requests.some((url) => url.endsWith(bucketB)));
});

test('registry lookup preserves category-scoped bare IDs and real dup suffixes without bodies', async (t) => {
  const { dataset, index, requests, bucketA, bucketB } = fixture(t, 'recipe-lookup');
  const rows = await resolveRecipeRows(dataset, index, ['r:shared', 'r:shared/dup_1', 'r:shared'], { includeTagRows: false });
  assert.deepEqual(rows.map((row) => [index.types[row.type], row.id]), [
    ['a:craft', 'r:shared'], ['b:craft', 'r:shared'], ['a:craft', 'r:shared/dup_1'],
  ]);
  assert.deepEqual((await clientRecipeFileRels(dataset, 'r:shared')).slice(0, 2), [bucketA, bucketB]);
  assert.equal((await resolveRecipeRows(dataset, index, ['r:shared'])).length, 3);
  const unknown = await resolveRecipeRows(dataset, { ...index, types: [] }, ['r:shared'], { includeTagRows: false });
  assert.deepEqual(unknown.map((row) => row.cat), ['a:craft', 'b:craft']);
  assert.equal(requests.filter((url) => url.includes('/blocks/')).length, 0);
});
