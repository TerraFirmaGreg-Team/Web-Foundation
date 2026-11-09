import 'server-only';
import { isSectionKey } from '@terrafirmagreg-team/sites/location';
import { sectionTabs } from '@terrafirmagreg-team/sites';
import { sections } from '@terrafirmagreg-team/kit/lib/sources';
import { pageImageSegments } from '@terrafirmagreg-team/kit/lib/urls';
import { toInternalSlugs } from '@terrafirmagreg-team/translate/lib/slug';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { SectionPage } from '@terrafirmagreg-team/kit/types';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { OgDock } from '../components/og-dock';
import { ogSectionIcon } from './og-icon';
import {
  ogHumanize,
  SECTION_PAGE_KIND,
  type OgBrand,
  type OgEntity,
} from './og';

const VARIANT_PREFIX = '~';
const IMAGE_NAME = 'image.webp';

export async function ogImageResponse(
  slug: string[] | undefined,
  brand: OgBrand,
): Promise<Response | undefined> {
  const [sectionName, datasetId, ...rest] = slug ?? [];
  const section = isSectionKey(sectionName) ? sectionName : undefined;
  if (rest[rest.length - 1] !== IMAGE_NAME || !section) return undefined;

  const pageSlugs: string[] = [];
  const variant = new URLSearchParams();
  for (const seg of rest.slice(0, -1)) {
    if (seg.startsWith(VARIANT_PREFIX)) {
      const raw = seg.slice(VARIANT_PREFIX.length);
      let decoded: string;
      try {
        decoded = decodeURIComponent(raw);
      } catch {
        decoded = raw;
      }
      for (const [key, value] of new URLSearchParams(decoded))
        variant.append(key, value);
    } else {
      pageSlugs.push(seg);
    }
  }

  const lang =
    (variant.get('lang') as Lang | null) ??
    loadLocaleRegistry().defaultLanguage;
  const page = pageSlugs.length
    ? ((await sections[section]
        ?.getSource()
        .then(
          (src) =>
            src?.getPage(
              toInternalSlugs([datasetId, ...pageSlugs], lang),
            ) as SectionPage | undefined,
        )) ?? undefined)
    : undefined;
  if (pageSlugs.length && !page?.data) return undefined;

  const version = variant.get('version') ?? undefined;
  const name = variant.get('name') ?? undefined;
  const entity: OgEntity | undefined = name
    ? { kind: variant.get('kind') ?? 'entity', name }
    : pageSlugs.length
      ? { kind: SECTION_PAGE_KIND[section] ?? 'page', name: page!.data.title }
      : undefined;

  const date = (page?.data as { date?: string | Date } | undefined)?.date;
  const title =
    entity?.name ?? (pageSlugs.length ? page!.data.title : undefined) ??
    ogHumanize(datasetId);
  const description =
    variant.get('desc') ??
    (page?.data.description ??
      (date ? String(date).slice(0, 10) : undefined));

  const accent = sectionConfig().sectionAccent?.[section] ?? '#ff96ff';
  const rendered = new ImageResponse(
    <OgDock
      title={title}
      description={description}
      site={brand.site}
      accent={accent}
      logo={brand.logo}
      section={section}
      badge={ogHumanize(datasetId)}
      version={version}
      icon={ogSectionIcon(section, accent)}
      siteUrl={new URL(brand.siteUrl).host}
      entity={entity}
    />,
    { width: 1200, height: 630 },
  );
  const webp = await sharp(
    Buffer.from(await rendered.arrayBuffer()),
  )
    .webp({ quality: 95 })
    .toBuffer();
  return new Response(new Uint8Array(webp), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': version
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=300, s-maxage=300',
    },
  });
}

export async function ogStaticParams(): Promise<{ slug: string[] }[]> {
  const rows = await Promise.all(
    sectionTabs.map(async ({ key }) => {
      const out = Object.entries(sectionConfig().datasetConfig)
        .filter(([, config]) => config.sections?.[key])
        .map(([id]) => ({ slug: [key, id, IMAGE_NAME] }));
      const src = sections[key] ? await sections[key].getSource() : undefined;
      if (src) {
        const pages = src.getPages();
        const used = new Set(pages.map((p) => p.slugs[0]));
        out.push(
          ...[...used].map((id) => ({ slug: [key, id, IMAGE_NAME] })),
          ...pages.map((page) => ({
            slug: [key, ...pageImageSegments(page.slugs, { raw: true })],
          })),
        );
      }
      return out;
    }),
  );
  return rows.flat();
}
