import type { AdvancedIndex } from 'fumadocs-core/search/server';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import { pageStructuredData } from './structured';

export type LocalizedIndex = AdvancedIndex & { locale: string };

export interface SearchIndexPage {
  slugs: string[];
  url: string;
  data: { title?: string; description?: string };
}

export interface SearchPageSource {
  getSource(): Promise<{ getPages(): SearchIndexPage[] }>;
}

export async function buildSearchIndexes(
  sources: Record<string, SearchPageSource | undefined>,
  languages: readonly string[],
): Promise<LocalizedIndex[]> {
  const pages: { section: string; page: SearchIndexPage }[] = [];
  for (const [section, entry] of Object.entries(sources)) {
    if (!entry) continue;
    for (const page of (await entry.getSource()).getPages()) {
      pages.push({ section, page });
    }
  }
  return (
    await Promise.all(
      pages.map(async ({ section, page }) => {
        const [dataset, lang] = page.slugs;
        if (!dataset || !lang) return null;
        return {
          title: page.data.title ?? page.url,
          description: page.data.description,
          url: stripLangFromUrl(page.url, [...languages]),
          id: page.url,
          tag: `${section}:${dataset}`,
          locale: lang,
          structuredData: await pageStructuredData(
            page.data as Record<string, unknown>,
          ),
        } satisfies LocalizedIndex;
      }),
    )
  ).filter((index) => index !== null);
}

