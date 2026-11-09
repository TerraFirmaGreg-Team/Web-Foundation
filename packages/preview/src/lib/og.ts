import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

export type OgEntity = {
  kind: string;
  name: string;
  id?: string;
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
