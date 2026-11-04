import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function sortLangCodes(codes: readonly string[]): string[] {
  return [...codes].sort((a, b) => {
    if (a === 'en_us') return -1;
    if (b === 'en_us') return 1;
    return a.localeCompare(b);
  });
}

export function isLang(
  value: string,
  languages: readonly string[],
): value is Lang {
  return languages.includes(value);
}

export function resolveLang(
  value: string | string[] | undefined | null,
  languages: readonly string[],
  defaultLanguage: string,
): Lang {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && isLang(raw, languages)) return raw;
  return defaultLanguage;
}

export function htmlLang(lang: Lang): string {
  return lang.split('_')[0] || lang;
}

function bcp47(lang: Lang): string {
  const [primary, region] = lang.split('_');
  if (!primary) return lang;
  return region ? `${primary}-${region.toUpperCase()}` : primary;
}

export function nativeLanguageName(lang: Lang): string | undefined {
  try {
    const tag = bcp47(lang);
    const name = new Intl.DisplayNames([tag], {
      type: 'language',
      languageDisplay: 'standard',
    }).of(tag);
    if (!name) return undefined;
    return name.charAt(0).toLocaleUpperCase(tag) + name.slice(1);
  } catch {
    return undefined;
  }
}

