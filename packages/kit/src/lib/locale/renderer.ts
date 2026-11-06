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

const store = globalThis as Record<symbol, unknown>;
const RENDERERS_KEY = Symbol.for('terrafirmagreg.locale.renderers');
const LOADER_KEY = Symbol.for('terrafirmagreg.locale.loader');

const renderers = (store[RENDERERS_KEY] ??= new Map<
  string,
  { resolve: LocaleResolve; render: LocaleRender }
>()) as Map<string, { resolve: LocaleResolve; render: LocaleRender }>;

export function registerLocaleRenderer(
  section: string,
  entry: { resolve: LocaleResolve; render: LocaleRender },
): void {
  renderers.set(section, entry);
}

export function localeRenderer(section: string) {
  return renderers.get(section);
}

export function registerLocaleLoader(next: LocaleLoader): void {
  store[LOADER_KEY] = next;
}

export function localeLoader(): LocaleLoader | undefined {
  return store[LOADER_KEY] as LocaleLoader | undefined;
}

