import { createGetUrl } from 'fumadocs-core/source';
import { sectionConfig } from './config';

export function canonicalUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, sectionConfig().siteUrl).toString();
}

export function getDatasetImageUrl(section: string, dataset: string) {
  const segments = [section, dataset, 'image.png'];

  return {
    segments,
    url: createGetUrl(sectionConfig().previewRoute)(segments),
  };
}

export function getPageImageUrl(section: string, slugs: string[]) {
  const segments = [section, ...slugs, 'image.png'];

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

