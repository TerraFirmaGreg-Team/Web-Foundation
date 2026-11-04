import type { ReactNode } from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type LocaleScope = { section: string; slug?: string[] };

export type LocaleResolve = (
  slug: string[] | undefined,
  lang: Lang,
) => Promise<{ page: unknown; isFallback: boolean } | undefined>;

export type LocaleRender = (
  page: unknown,
  slug: string[] | undefined,
  lang: Lang,
) => ReactNode | Promise<ReactNode>;

export type LocaleLoadResult = { node: ReactNode; missing: boolean } | null;

export type LocaleLoader = (
  scope: LocaleScope,
  lang: Lang,
) => Promise<LocaleLoadResult>;

const renderers = new Map<
  string,
  { resolve: LocaleResolve; render: LocaleRender }
>();

export function registerLocaleRenderer(
  section: string,
  entry: { resolve: LocaleResolve; render: LocaleRender },
): void {
  renderers.set(section, entry);
}

export function localeRenderer(section: string) {
  return renderers.get(section);
}

let loader: LocaleLoader | undefined;

export function registerLocaleLoader(next: LocaleLoader): void {
  loader = next;
}

export function localeLoader(): LocaleLoader | undefined {
  return loader;
}

