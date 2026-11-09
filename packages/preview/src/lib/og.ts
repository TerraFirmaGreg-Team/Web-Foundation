import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { OgSprite } from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

export type OGSprite = OgSprite;

export type OgEntity = {
  kind: string;
  name: string;
  id?: string;
  format?: string;
};

export type OgContext = {
  entity?: OgEntity;
  icon?: OGSprite;
  description?: string;
  imageQuery?: string;
};

export type OgBrand = {
  site: string;
  siteUrl: string;
  logo: string;
};

export type OgContextResolver = (
  dataset: DatasetRef,
  search: URLSearchParams,
  lang: Lang,
) => Promise<OgContext>;

export function ogName(raw: string): Pick<OgEntity, 'name' | 'format'> {
  return { name: stripMcFormat(raw).trim(), format: raw };
}

const resolvers = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.preview.og')
] ??= new Map<string, OgContextResolver>()) as Map<
  string,
  OgContextResolver
>;

export function registerOgResolver(
  section: string,
  resolve: OgContextResolver,
): void {
  resolvers.set(section, resolve);
}

export async function resolveOgContext(
  section: string,
  dataset: DatasetRef,
  search: URLSearchParams,
  lang: Lang,
): Promise<OgContext> {
  try {
    return (await resolvers.get(section)?.(dataset, search, lang)) ?? {};
  } catch {
    return {};
  }
}
