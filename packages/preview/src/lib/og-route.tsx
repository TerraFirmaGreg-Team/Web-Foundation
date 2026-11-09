import 'server-only';
import { isSectionKey } from '@terrafirmagreg-team/sites/location';
import { sectionTabs } from '@terrafirmagreg-team/sites';
import { sectionDatasets } from '@terrafirmagreg-team/kit/lib/datasets';
import { sections } from '@terrafirmagreg-team/kit/lib/sources';
import type { SectionPage } from '@terrafirmagreg-team/kit/types';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { ImageResponse } from 'next/og';
import {
  OgDock,
  SECTION_ACCENT,
  SECTION_PAGE_KIND,
} from '../components/og-dock';
import { ogSectionIcon } from './og-icon';
import { resolveOgContext, type OgBrand } from './og';

export async function ogImageResponse(
  slug: string[] | undefined,
  search: URLSearchParams,
  brand: OgBrand,
): Promise<Response | undefined> {
  const [sectionName, datasetId, ...rest] = slug ?? [];
  const section = isSectionKey(sectionName) ? sectionName : undefined;
  if (rest[rest.length - 1] !== 'image.png' || !section) return undefined;
  const dataset = (await sectionDatasets(section)).find(
    (d) => d.id === datasetId,
  );
  if (!dataset) return undefined;

  const pageSlugs = rest.slice(0, -1);
  let title = dataset.title ?? dataset.id;
  let description = dataset.description;
  if (pageSlugs.length) {
    const page = (await sections[section]?.getSource())?.getPage([
      dataset.id,
      ...pageSlugs,
    ]) as SectionPage | undefined;
    if (!page?.data) return undefined;
    title = page.data.title;
    const date = (page.data as { date?: string | Date }).date;
    description =
      page.data.description ??
      (date ? String(date).slice(0, 10) : undefined) ??
      description;
  }

  const ref = {
    id: dataset.id,
    version: search.get('version') ?? dataset.versions?.[0],
  };
  const { defaultLanguage, languages } = loadLocaleRegistry();
  const langParam = search.get('lang');
  const lang =
    langParam && languages.includes(langParam)
      ? (langParam as Lang)
      : languages.includes(pageSlugs[0] ?? '')
        ? (pageSlugs[0] as Lang)
        : defaultLanguage;
  const ctx = await resolveOgContext(section, ref, search, lang);
  const accent = SECTION_ACCENT[section] ?? '#ff96ff';
  const entity =
    ctx.entity ??
    (pageSlugs.length
      ? { kind: SECTION_PAGE_KIND[section] ?? 'page', name: title }
      : undefined);

  const props = {
    title: entity?.name ?? title,
    description: ctx.description ?? description,
    site: brand.site,
    accent,
    logo: brand.logo,
    section,
    badge: dataset.title ?? dataset.id,
    version: ref.version,
    sprite: ctx.icon,
    icon: ogSectionIcon(section, accent),
    siteUrl: new URL(brand.siteUrl).host,
    entity,
  };
  return new ImageResponse(<OgDock {...props} />, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': ref.version
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=300, s-maxage=300',
    },
  });
}

export async function ogStaticParams(): Promise<{ slug: string[] }[]> {
  const rows = await Promise.all(
    sectionTabs.map(async ({ key }) => {
      if (!sections[key]) return [];
      const pages = (await sections[key]!.getSource()).getPages();
      const used = new Set(pages.map((page) => page.slugs[0]));
      return (await sectionDatasets(key))
        .filter((dataset) => used.has(dataset.id))
        .flatMap((dataset) => [
          { slug: [key, dataset.id, 'image.png'] },
          ...pages
            .filter((page) => page.slugs[0] === dataset.id)
            .map((page) => ({
              slug: [key, ...page.slugs, 'image.png'],
            })),
        ]);
    }),
  );
  return rows.flat();
}
