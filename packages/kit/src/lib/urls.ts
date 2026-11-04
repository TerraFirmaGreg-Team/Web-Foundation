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

