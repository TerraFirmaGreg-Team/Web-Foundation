import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

type Call = [unknown, string, string];
const calls: { replace: Call[]; push: Call[] } = { replace: [], push: [] };
let location = { href: 'http://x.test/wiki?a=1', search: '?a=1' };
let failWrites = false;

(globalThis as Record<string, unknown>).window = {
  location,
  addEventListener: () => {},
  removeEventListener: () => {},
  history: {
    replaceState(state: unknown, _: string, href: string) {
      if (failWrites) throw new DOMException('throttled', 'SecurityError');
      calls.replace.push([state, _, href]);
      location.href = new URL(href, location.href).href;
      location.search = new URL(href, location.href).search;
    },
    pushState(state: unknown, _: string, href: string) {
      if (failWrites) throw new DOMException('throttled', 'SecurityError');
      calls.push.push([state, _, href]);
      location.href = new URL(href, location.href).href;
      location.search = new URL(href, location.href).search;
    },
  },
};

const { replaceUrlState, pushUrlState } = await import('./history');

describe('url state writes', () => {
  beforeEach(() => {
    calls.replace.length = 0;
    calls.push.length = 0;
    failWrites = false;
    location.href = 'http://x.test/wiki?a=1';
    location.search = '?a=1';
  });

  it('skips a write when the resolved url is unchanged', () => {
    replaceUrlState('/wiki?a=1');
    replaceUrlState('http://x.test/wiki?a=1');
    pushUrlState('/wiki?a=1#frag'.replace('#frag', ''));
    assert.equal(calls.replace.length, 0);
    assert.equal(calls.push.length, 0);
  });

  it('writes when the url differs', () => {
    replaceUrlState('/wiki?a=2');
    pushUrlState('/wiki?a=3');
    assert.equal(calls.replace.length, 1);
    assert.equal(calls.push.length, 1);
    assert.equal(calls.push[0][2], '/wiki?a=3');
  });

  it('does not propagate history api failures', () => {
    failWrites = true;
    assert.doesNotThrow(() => replaceUrlState('/wiki?a=2'));
    assert.doesNotThrow(() => pushUrlState('/wiki?a=3'));
    assert.equal(calls.replace.length, 0);
    assert.equal(calls.push.length, 0);
  });

  it('keeps accepting writes after a failure', () => {
    failWrites = true;
    replaceUrlState('/wiki?a=2');
    failWrites = false;
    replaceUrlState('/wiki?a=3');
    assert.equal(calls.replace.length, 1);
  });
});
