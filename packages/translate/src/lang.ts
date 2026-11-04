import type { ReactNode } from 'react';

export interface LangConfig<Languages extends string = string> {

  languages: Languages[];

  defaultLanguage: NoInfer<Languages>;

  hideLocale?: 'always' | 'default-locale' | 'never';

  parser?: 'dot' | 'dir' | 'none';

  fallbackLanguage?: NoInfer<Languages> | null;
}

export interface LocaleItem {
  name: string;
  locale: string;
}

export interface LangProviderProps
  extends Partial<Pick<LangConfig, 'defaultLanguage' | 'hideLocale'>> {
  locale?: string;
  onLocaleChange?: (v: string) => void;
  translations?: Partial<Record<string, string>>;
  locales?: LocaleItem[];
  children?: ReactNode;
}

