import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function stripLangFromUrl(
  url: string,
  languages: readonly string[],
): string {
  const langPathPattern = new RegExp(
    `\\/(${languages.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, '\$&')).join('|')})(?=\\/|$)`,
  );
  return url.replace(langPathPattern, '');
}

export function toInternalSlugs(
  slug: string[] | undefined,
  lang: Lang,
): string[] | undefined {
  if (!slug?.length) return undefined;
  const [dataset, ...rest] = slug;
  return [dataset, lang, ...rest];
}

export function toPublicSlug(
  slugs: string[],
  languages: readonly string[],
): string[] {
  const [dataset, maybeLang, ...rest] = slugs;
  if (!dataset || !languages.includes(maybeLang)) return slugs;
  return [dataset, ...rest];
}

