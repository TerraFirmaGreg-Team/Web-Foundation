import { createRelativeLink } from '@terrafirmagreg-team/kit/components/relative-link';
import { getMDXComponents } from '@terrafirmagreg-team/mdx/components/mdx-components';
import { datasetCatalog } from '@terrafirmagreg-team/kit/lib/datasets';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { lookupPagePreview } from '@terrafirmagreg-team/kit/lib/preview/lookup';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import type { SectionSource } from '@terrafirmagreg-team/kit/lib/page';
import type { SectionPage } from '@terrafirmagreg-team/kit/types';
import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source';
import type { MDXContent } from 'mdx/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { ChangelogTimelineEntry } from './timeline';

export async function timelineEntries(
  source: SectionSource,
  route: string,
  dataset: string,
  lang: Lang,
  repo?: `${string}/${string}`,
): Promise<ChangelogTimelineEntry[]> {
  const catalog = await datasetCatalog();
  const { defaultLanguage } = loadLocaleRegistry();
  const byFile = new Map<string, { own?: SectionPage; fallback?: SectionPage }>();
  for (const raw of source.getPages()) {
    const page = raw as unknown as SectionPage;
    if (page.slugs[0] !== dataset) continue;
    const pageLang = (page.locale ?? page.slugs[1]) as Lang;
    const key = page.slugs.slice(2).join('/');
    const slot = byFile.get(key) ?? {};
    if (pageLang === lang) slot.own = page;
    else if (pageLang === defaultLanguage) slot.fallback = page;
    byFile.set(key, slot);
  }
  const entries: ChangelogTimelineEntry[] = [];
  for (const { own, fallback } of byFile.values()) {
    const page = own ?? fallback;
    if (!page) continue;
    const pageLang = (page.locale ?? page.slugs[1] ?? lang) as Lang;
    const data = page.data as {
      date?: string | Date;
      frontmatter?: { date?: string | Date };
    };
    const rawDate = data.date ?? data.frontmatter?.date;
    if (!rawDate) continue;
    const { body: MDX } = (await (
      page.data as unknown as {
        load(): Promise<{ body: MDXContent }>;
      }
    ).load()) as { body: MDXContent };
    const link = createRelativeLink(
      source as LoaderOutput<LoaderConfig>,
      page as unknown as Page,
      (props) => (
        <LinkPreview
          preview={lookupPagePreview(catalog, props.href, pageLang)}
          {...props}
        />
      ),
    );
    const body = <MDX components={getMDXComponents({ a: link })} />;
    const fileSlug = page.slugs.slice(2);
    entries.push({
      id: fileSlug.join('/'),
      title: page.data.title,
      date: new Date(rawDate),
      url: `${route}/${dataset}/${fileSlug.join('/')}`,
      releaseUrl: repo
        ? `https://github.com/${repo}/releases/tag/${page.data.title}`
        : undefined,
      untranslated: !own,
      body,
    });
  }
  return entries;
}
