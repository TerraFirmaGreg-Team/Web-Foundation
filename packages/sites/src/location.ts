import { dumpSections, sectionTabs, type SectionKey } from './sections';
import type { SiteKey } from './hosts';

const tabsByKey = Object.fromEntries(
  sectionTabs.map((tab) => [tab.key, tab]),
) as Record<string, { url: string; site?: SiteKey }>;

const keys = new Set(sectionTabs.map(({ key }) => key));

export function sectionUrl(section: SectionKey, dataset?: string): string {
  const tab = tabsByKey[section];
  return tab.site || !dataset ? tab.url : `${tab.url}/${dataset}`;
}

export function isSectionKey(value: string | undefined): value is SectionKey {
  return value !== undefined && keys.has(value as SectionKey);
}

export type SectionLocation = {
  section?: SectionKey;

  dataset?: string;
};

export function isDumpSection(section: SectionKey | undefined): boolean {
  return section !== undefined && dumpSections.has(section);
}

export function dumpSectionKeys(): readonly SectionKey[] {
  return [...dumpSections];
}

export type DatasetRef = { id: string; version?: string };

export type DatasetVersionInfo = {
  versions?: readonly string[];
  latest?: string;
};

export function datasetRef(id: string, version?: string): DatasetRef {
  return version ? { id, version } : { id };
}

export function parseDatasetRef(ref: string): { id: string; version?: string } {
  const at = ref.lastIndexOf('@');
  return at > 0
    ? { id: ref.slice(0, at), version: ref.slice(at + 1) }
    : { id: ref };
}

export function resolveDatasetRef(
  id: string,
  version: string | undefined,
  info?: DatasetVersionInfo,
): { id: string; pinned?: string; ref: DatasetRef } {
  const pinned =
    version &&
    version !== (info?.latest ?? info?.versions?.[0]) &&
    info?.versions?.includes(version)
      ? version
      : undefined;
  return { id, pinned, ref: { id, version: pinned } };
}

export function versionSuffix({ version }: DatasetRef): string {
  return version ? `&version=${encodeURIComponent(version)}` : '';
}

export function parseSectionLocation(
  pathname: string,
  basePath = '',
): SectionLocation {
  const path =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length)
      : pathname;
  const [section, dataset] = path.split('/').filter(Boolean);
  if (!isSectionKey(section)) return {};
  return { section, dataset };
}

export type { SectionKey } from './sections';
