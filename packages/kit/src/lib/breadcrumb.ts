import 'server-only';
import type * as PageTree from 'fumadocs-core/page-tree';
import { searchPath } from 'fumadocs-core/breadcrumb';
import { stripLangFromUrl } from '@terrafirmagreg-team/translate/lib/slug';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { localizePageTree } from '@terrafirmagreg-team/translate/server';
import { sourceLanguages } from './languages';
import { lookupPagePreview } from './preview/lookup';
import { datasetId } from './tree';
import type { SectionSource } from './page';
import type { DatasetCatalog, SectionPage } from '@terrafirmagreg-team/kit/types';

export type SectionCrumb = { name: string; url?: string };

function nodeName(name: unknown): string {
  return typeof name === 'string' ? name : '';
}

export function sectionBreadcrumbItems(
  source: SectionSource,
  page: SectionPage,
  lang: Lang,
): SectionCrumb[] {
  const languages = sourceLanguages(source);
  const tree = localizePageTree(source.getPageTree(), lang, {
    languages,
    fallbackLanguage: loadLocaleRegistry().defaultLanguage,
  });
  const dataset = page.slugs[0];
  const folder = tree.children.find(
    (node): node is PageTree.Folder =>
      node.type === 'folder' && datasetId(node) === dataset,
  );
  if (!folder) return [{ name: page.data.title }];

  const pageUrl = stripLangFromUrl(page.url, languages);
  if (folder.index?.url === pageUrl) return [];

  const trail = searchPath(folder.children, pageUrl);
  const items: SectionCrumb[] = [];
  for (const node of trail?.slice(0, -1) ?? []) {
    if (node.type === 'folder') {
      items.push({ name: nodeName(node.name), url: node.index?.url });
    }
  }
  items.push({ name: page.data.title });
  return items;
}

export function sectionBreadcrumbPreviews(
  items: readonly SectionCrumb[],
  lang: Lang,
  catalog: DatasetCatalog,
): Record<string, PagePreviewData> {
  const previews: Record<string, PagePreviewData> = {};
  for (const item of items) {
    if (!item.url) continue;
    const preview = lookupPagePreview(catalog, item.url, lang);
    if (preview) previews[item.url] = preview;
  }
  return previews;
}

