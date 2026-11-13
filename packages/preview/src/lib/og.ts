import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

export type OgEntity = {
  kind: string;
  name: string;
  id?: string;
  icon?: string;
};

export const SECTION_PAGE_KIND: Record<string, string> = {
  changelog: 'release',
};

export type OgContext = {
  entity?: OgEntity;
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

export function ogName(raw: string): Pick<OgEntity, 'name'> {
  return { name: stripMcFormat(raw).trim() };
}

export function ogImageQuery(
  entity: OgEntity,
  description?: string,
): string {
  const params = new URLSearchParams();
  params.set('kind', entity.kind);
  params.set('name', entity.name);
  if (entity.icon) params.set('icon', entity.icon);
  if (description) params.set('desc', description);
  return params.toString();
}

export function ogHumanize(value: string): string {
  const last = value.split(/[:/#]/).filter(Boolean).pop() ?? value;
  return last
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

export type OgIconResolver = (
  dataset: DatasetRef,
  icon: string,
) => Promise<string | undefined>;

const iconResolvers = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.preview.ogIcon')
] ??= new Map<string, OgIconResolver>()) as Map<
  string,
  OgIconResolver
>;

export function registerOgIconResolver(
  resolve: OgIconResolver,
): void {
  iconResolvers.set('default', resolve);
}

export async function resolveOgIcon(
  dataset: DatasetRef,
  icon: string,
): Promise<string | undefined> {
  try {
    return await iconResolvers.get('default')?.(dataset, icon);
  } catch {
    return undefined;
  }
}
