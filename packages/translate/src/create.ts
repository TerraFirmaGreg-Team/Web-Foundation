import type {
  Lang,
  LocaleMessages,
  LocaleRegistry,
} from './types/locale';
import type { LangConfig, LangProviderProps, LocaleItem } from './lang';
import { nativeLanguageName } from './lib/code';

export function localeItems(codes: readonly string[]): LocaleItem[] {
  return codes.map((code) => ({
    locale: code,
    name: nativeLanguageName(code) ?? code,
  }));
}

function messagesFor(
  lang: Lang,
  registry: LocaleRegistry,
  fallback: LocaleMessages,
): LocaleMessages & { displayName: string } {
  const locale = registry.messages[lang];
  const merged = { ...fallback, ...locale };
  const displayName = nativeLanguageName(lang) ?? lang;
  const { 'language.name': _name, displayName: _dn, ...rest } = merged;
  return { ...rest, displayName };
}

export function createLocaleSet(registry: LocaleRegistry) {
  const fallback = {
    ...(registry.messages[registry.defaultLanguage] ?? {}),
  };
  const bundles: Record<string, LocaleMessages & { displayName: string }> = {};
  for (const lang of registry.languages) {
    bundles[lang] = messagesFor(lang, registry, fallback);
  }

  const config: LangConfig = {
    defaultLanguage: registry.defaultLanguage,
    languages: [...registry.languages],
    fallbackLanguage: registry.defaultLanguage,
  };

  return {
    fumadocs: config,
    translations: bundles,
    languages: registry.languages,
    defaultLanguage: registry.defaultLanguage,
    providerProps(lang: Lang): LangProviderProps {
      const locale = lang ?? registry.defaultLanguage;
      return {
        locale,
        defaultLanguage: registry.defaultLanguage,
        translations: bundles[locale] ?? bundles[registry.defaultLanguage],
        locales: registry.languages.map((code) => ({
          locale: code,
          name: bundles[code]?.displayName ?? code,
        })),
      };
    },
  };
}

export type LocaleSet = ReturnType<typeof createLocaleSet>;

