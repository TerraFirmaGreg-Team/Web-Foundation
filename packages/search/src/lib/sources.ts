import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { SearchClient } from 'fumadocs-core/search/client';

export type SearchClientSourceCtx = {
  refs: DatasetRef[];
  locale: string;
  tag?: string | string[];
};

export type SearchClientSource = (ctx: SearchClientSourceCtx) => SearchClient;

const sources = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.search.sources')
] ??= []) as SearchClientSource[];

export function registerSearchClientSource(source: SearchClientSource): void {
  sources.push(source);
}

export function getSearchClientSources(): readonly SearchClientSource[] {
  return sources;
}

