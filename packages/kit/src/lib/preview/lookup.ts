import 'server-only';
import { resolveLang } from '@terrafirmagreg-team/translate/lib/code';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { isSectionKey } from '@terrafirmagreg-team/sites/location';
import { resolvePage } from '@terrafirmagreg-team/kit/lib/page';
import { sections } from '@terrafirmagreg-team/kit/lib/sources';
import type {
  DatasetCatalog,
  SectionKey,
  SectionPage,
} from '@terrafirmagreg-team/kit/types';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function lookupPagePreview(
  catalog: DatasetCatalog,
  href: string | undefined,
  lang?: Lang,
): PagePreviewData | undefined {
  if (!href || /^(https?:|mailto:|\/\/|#)/i.test(href)) return undefined;
  const [withoutHash] = href.split('#');
  const [pathname, qs] = withoutHash.split('?');
  if (!pathname.startsWith('/')) return undefined;

  const { defaultLanguage } = loadLocaleRegistry();
  const parts = pathname.split('/').filter(Boolean);
  if (!isSectionKey(parts[0])) return undefined;

  const section = sections[parts[0]];
  if (!section) return undefined;
  const dataset = catalog[parts[0] as SectionKey]?.find(
    (row) => row.id === parts[1],
  );
  const pageLang = resolveLang(
    new URLSearchParams(qs).get('lang') ?? lang,
    dataset?.languages ?? [...sectionConfig().knownLanguages],
    defaultLanguage,
  );
  const source = section.getSourceSync?.();
  if (!source) return undefined;
  const resolved = resolvePage(source, parts.slice(1), pageLang);
  const page = resolved?.page as SectionPage | undefined;
  if (!page) return undefined;
  return {
    title: page.data.title,
    description: page.data.description,
    icon: dataset?.icon ? { type: 'icon', name: dataset.icon } : undefined,
  };
}

