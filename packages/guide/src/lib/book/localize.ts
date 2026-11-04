import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import type { DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';

export type FallbackTracker = {
  mark(key: string | undefined): void;
  readonly flag: 'untranslated' | 'partial' | undefined;
};

export function fallbackTracker(
  rawLang: Record<string, string> | undefined,
): FallbackTracker | undefined {
  if (!rawLang) return undefined;
  let total = 0;
  let missing = 0;
  return {
    mark(key) {
      if (!key) return;
      total += 1;
      if (!langString(rawLang, key)) missing += 1;
    },
    get flag() {
      if (!missing) return undefined;
      return missing === total ? 'untranslated' : 'partial';
    },
  };
}

export function markTextKeys(
  texts: DumpText[] | undefined,
  tracker: FallbackTracker | undefined,
) {
  if (!tracker) return;
  for (const text of texts ?? []) {
    tracker.mark(text.translate);
    markTextKeys(text.with, tracker);
    markTextKeys(text.extra, tracker);
  }
}

export function localize(
  map: Record<string, string>,
  key: string | undefined,
  fallback: string,
  tracker?: FallbackTracker,
): string {
  if (!key) return fallback;
  tracker?.mark(key);
  const bare =
    key.startsWith('{') && key.endsWith('}') ? key.slice(1, -1).trim() : key;
  return langString(map, key) ?? (bare !== key ? bare : fallback);
}

const LANG_KEY_WRAP = /^\{[^{}]+\}$/;

export function localizeGuideValue(
  value: unknown,
  map: Record<string, string>,
  tracker?: FallbackTracker,
): unknown {
  if (typeof value === 'string') {
    if (!LANG_KEY_WRAP.test(value)) return value;
    tracker?.mark(value);
    return langString(map, value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => localizeGuideValue(item, map, tracker));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = localizeGuideValue(item, map, tracker);
    }
    return out;
  }
  return value;
}

