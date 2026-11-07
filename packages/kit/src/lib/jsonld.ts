import 'server-only';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import { sectionConfig } from './config';
import { canonicalUrl } from './urls';
import type { SectionCrumb } from './breadcrumb';
import type { SectionKey, SectionPage } from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function pageJsonLd({
  section,
  page,
  crumbs,
  lang,
}: {
  section: SectionKey;
  page: SectionPage;
  crumbs: readonly SectionCrumb[];
  lang: Lang;
}): Record<string, unknown>[] {
  const languages = [...sectionConfig().knownLanguages];
  const url = canonicalUrl(stripLangFromUrl(page.url, languages));
  const items = crumbs.length ? crumbs : [{ name: page.data.title }];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.data.title,
      description: page.data.description,
      url,
      inLanguage: lang.replace('_', '-'),
      isPartOf: { '@type': 'WebSite', url: canonicalUrl(`/${section}`) },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
          ? canonicalUrl(stripLangFromUrl(crumb.url, languages))
          : url,
      })),
    },
  ];
}
