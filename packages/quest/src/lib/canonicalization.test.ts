import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createQuestCanonicalization } from './canonicalization';

const selection = { id: 'pack', version: '1.0' };

test('first load retains default category and entry canonicalization', () => {
  const memory = createQuestCanonicalization();
  assert.equal(memory.claimCategory(selection), true);
  assert.equal(memory.claimCategory(selection), false);
  assert.equal(memory.claimChapter(selection, 'start'), true);
  assert.equal(memory.claimChapter(selection, 'start'), false);
});

test('confirmed revisions retain exact location and do not reopen a closed quest', () => {
  const memory = createQuestCanonicalization();
  const location = new URL('https://wiki.test/quest/pack/ru_ru?category=start&version=1.0&search=copper&item=mod%3Aitem');
  const category = location.searchParams.get('category')!;
  assert.equal(memory.claimCategory({ ...selection, revision: 'a' }, category), true);
  assert.equal(memory.claimChapter({ ...selection, revision: 'a' }, category), true);
  const closedLocation = location.href;
  let replacements = 0;
  const confirmed = { ...selection, revision: 'b' };
  if (memory.claimCategory(confirmed, category)) replacements++;
  if (memory.claimChapter(confirmed, category)) {
    replacements++;
    location.searchParams.set('id', 'default-entry');
  }
  assert.equal(replacements, 0);
  assert.equal(location.href, closedLocation);
  assert.equal(location.searchParams.has('id'), false);
});

test('category, pack and explicit-version navigation reset canonicalization without using revision or language', () => {
  const memory = createQuestCanonicalization();
  const translated = { ...selection, lang: 'ru_ru' };
  for (const claim of [memory.claimCategory, memory.claimChapter]) {
    assert.equal(claim(selection, 'a'), true);
    assert.equal(claim(translated, 'a'), false);
    assert.equal(claim(selection, 'b'), true);
    assert.equal(claim(selection, 'a'), true);
    assert.equal(claim({ ...selection, version: '2.0' }, 'a'), true);
    assert.equal(claim({ ...selection, id: 'another' }, 'a'), true);
  }
});

test('a bare selection keeps its canonicalization memory when latest changes pack version', () => {
  const memory = createQuestCanonicalization();
  const latestSelection = { id: selection.id };
  assert.equal(memory.claimChapter(latestSelection, 'start'), true);
  assert.equal(memory.claimChapter({ ...latestSelection }, 'start'), false);
});
