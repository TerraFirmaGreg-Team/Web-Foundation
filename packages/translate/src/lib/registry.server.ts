import 'server-only';
import { createLocaleSet, type LocaleSet } from '@terrafirmagreg-team/translate/create';
import { translateConfig } from '@terrafirmagreg-team/translate/config';
import { flattenMessages } from './flatten';
import { sortLangCodes } from './code';
import type { LocaleMessages, LocaleRegistry } from '@terrafirmagreg-team/translate/types/locale';

export { sortLangCodes };

const LANG_PATTERN = /^[a-z]{2}(_[a-z0-9]+)?$/i;

let cached: LocaleRegistry | undefined;
let cachedSet: LocaleSet | undefined;

function flattenAll(
  raw: Record<string, unknown>,
  origin: string,
): Record<string, LocaleMessages> {
  const messages: Record<string, LocaleMessages> = {};
  for (const [code, value] of Object.entries(raw)) {
    if (!LANG_PATTERN.test(code)) {
      throw new Error(`Invalid locale code "${code}" in ${origin}`);
    }
    messages[code] = flattenMessages(value, `${origin}/${code}.json`);
  }
  return messages;
}

function discoverLocaleRegistry(): LocaleRegistry {
  const catalogs = [translateConfig().locales ?? []].flat();

  const messages: Record<string, LocaleMessages> = {};
  for (const catalog of catalogs) {
    const flattened = flattenAll(catalog, 'locales');
    for (const [lang, catalogMessages] of Object.entries(flattened)) {
      messages[lang] = { ...messages[lang], ...catalogMessages };
    }
  }

  const languages = sortLangCodes(Object.keys(messages));
  if (languages.length === 0) {
    throw new Error('No locale messages registered');
  }
  const defaultLanguage = languages.includes('en_us')
    ? 'en_us'
    : languages[0]!;
  return { languages, defaultLanguage, messages };
}

export function loadLocaleRegistry(): LocaleRegistry {
  cached ??= discoverLocaleRegistry();
  return cached;
}

export function loadLocaleSet(): LocaleSet {
  cachedSet ??= createLocaleSet(loadLocaleRegistry());
  return cachedSet;
}

