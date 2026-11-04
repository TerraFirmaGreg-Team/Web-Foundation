'use client';
import { createContext, useContext } from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type ResolvedLangValue = {
  lang: Lang;

  defaultLang: Lang;
  setLang: (lang: Lang) => void;
};

export const ResolvedLangContext = createContext<ResolvedLangValue | null>(
  null,
);

export type LangScopeValue = {
  langs: readonly Lang[] | null;
  setLangs: (langs: readonly Lang[] | null) => void;
};

export const LangScopeContext = createContext<LangScopeValue>({
  langs: null,
  setLangs: () => {},
});

export function useResolvedLang(): Lang {
  const ctx = useContext(ResolvedLangContext);
  if (!ctx) throw new Error('Missing ResolvedLangContext');
  return ctx.lang;
}

export function useDefaultLang(): Lang {
  const ctx = useContext(ResolvedLangContext);
  if (!ctx) throw new Error('Missing ResolvedLangContext');
  return ctx.defaultLang;
}

