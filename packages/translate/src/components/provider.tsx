'use client';
import {
  createContext,
  use,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { TranslationProvider } from './runtime';
import { LangScopeContext } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import type { LangProviderProps, LocaleItem } from '@terrafirmagreg-team/translate/lang';

export interface LangContextValue {
  locale?: string;
  locales?: LocaleItem[];
  onLocaleChange?: (v: string) => void;
}

const LangContext = createContext<LangContextValue>({});

export function LangProvider({
  locale,
  translations,
  locales,
  onLocaleChange,
  children,
}: LangProviderProps) {
  const value = useMemo(
    () => ({ locale, locales, onLocaleChange }),
    [locale, locales, onLocaleChange],
  );
  return (
    <LangContext value={value}>
      <TranslationProvider translations={translations ?? {}}>
        {children}
      </TranslationProvider>
    </LangContext>
  );
}

export function useLang(): LangContextValue {
  return use(LangContext);
}

export function LangLocalesScope({
  locales,
  children,
}: {
  locales: readonly LocaleItem[];
  children: ReactNode;
}) {
  const base = useLang();
  const { setLangs } = use(LangScopeContext);
  const scopeKey = locales.map((item) => item.locale).join(',');
  useLayoutEffect(() => {
    const langs = scopeKey ? scopeKey.split(',') : null;
    setLangs(langs);
    return () => setLangs(null);
  }, [scopeKey, setLangs]);
  const value = useMemo(
    () => ({ ...base, locales: [...locales] }),
    [base, locales],
  );
  return <LangContext value={value}>{children}</LangContext>;
}

