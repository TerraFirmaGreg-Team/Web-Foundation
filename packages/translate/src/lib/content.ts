import 'server-only';
import type { ReactNode } from 'react';
import { loadLocaleRegistry } from './registry.server';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { LangContent } from '@terrafirmagreg-team/translate/types/content';

type Resolve<P> = (
  slug: string[] | undefined,
  lang: Lang,
) => { page: P; isFallback: boolean } | undefined;

type Get<P> = (slug: string[] | undefined, lang: Lang) => P | undefined;

export function langContent<P>(
  slug: string[] | undefined,
  resolve: Resolve<P>,
  render: (page: P, lang: Lang) => ReactNode,
  preferred?: Lang,
): LangContent | null {
  const { messages, defaultLanguage } = loadLocaleRegistry();
  if (preferred && preferred !== defaultLanguage) {
    const wanted = resolve(slug, preferred);
    if (wanted && !wanted.isFallback) {
      return { lang: preferred, node: render(wanted.page, preferred) };
    }
  }
  const primary = resolve(slug, defaultLanguage);
  if (primary && !primary.isFallback) {
    return {
      lang: defaultLanguage,
      node: render(primary.page, defaultLanguage),
    };
  }
  for (const locale of Object.keys(messages)) {
    const resolved = resolve(slug, locale as Lang);
    if (!resolved || resolved.isFallback) continue;
    return { lang: locale as Lang, node: render(resolved.page, locale as Lang) };
  }
  return primary
    ? { lang: defaultLanguage, node: render(primary.page, defaultLanguage) }
    : null;
}

export function firstLocalizedPage<P>(
  slug: string[] | undefined,
  getPage: Get<P>,
  initial?: P,
): P | undefined {
  if (initial) return initial;
  const { languages, defaultLanguage } = loadLocaleRegistry();
  const page = getPage(slug, defaultLanguage);
  if (page) return page;
  for (const locale of languages) {
    if (locale === defaultLanguage) continue;
    const found = getPage(slug, locale as Lang);
    if (found) return found;
  }
  return undefined;
}

