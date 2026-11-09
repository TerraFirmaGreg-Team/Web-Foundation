import { createGetUrl } from 'fumadocs-core/source';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { sectionConfig } from './config';

export function canonicalUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, sectionConfig().siteUrl).toString();
}

export function getDatasetImageUrl(
  section: string,
  dataset: string,
  version?: string,
) {
  const segments = [section, dataset];
  if (version)
    segments.push(`~version%3D${encodeURIComponent(version)}`);
  segments.push('image.webp');

  return {
    segments,
    url: createGetUrl(sectionConfig().previewRoute)(segments),
  };
}

export function getVariantImageUrl(
  section: string,
  dataset: string,
  query: string,
) {
  const segments = [
    section,
    dataset,
    `~${encodeURIComponent(query)}`,
    'image.webp',
  ];

  return {
    segments,
    url: createGetUrl(sectionConfig().previewRoute)(segments),
  };
}

export function pageImageSegments(
  slugs: string[],
  { raw }: { raw?: boolean } = {},
): string[] {
  const { languages, defaultLanguage } = loadLocaleRegistry();
  const [dataset, maybeLang, ...rest] = slugs;
  const lang =
    maybeLang && (languages as string[]).includes(maybeLang)
      ? maybeLang
      : undefined;
  const out = lang ? [dataset, ...rest] : slugs;
  if (lang && lang !== defaultLanguage) {
    const variant = `lang=${lang}`;
    out.push(raw ? `~${variant}` : `~${encodeURIComponent(variant)}`);
  }
  out.push('image.webp');
  return out;
}

export function getPageImageUrl(section: string, slugs: string[]) {
  const segments = [section, ...pageImageSegments(slugs)];

  return {
    segments,
    url: createGetUrl(sectionConfig().previewRoute)(segments),
  };
}

export function createGitFileUrl(git: {
  user: string;
  repo: string;
  branch: string;
}) {
  return (filePath: string) =>
    `https://github.com/${git.user}/${git.repo}/blob/${git.branch}/${filePath}`;
}

