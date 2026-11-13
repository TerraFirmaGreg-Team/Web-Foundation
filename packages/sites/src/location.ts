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

export interface DatasetSelection {
  id: string;
  version?: string;
}

export interface DatasetRef extends DatasetSelection {
  revision?: string;

  pin?: string;
}

export type DatasetSnapshot = DatasetRef & { version: string; revision: string };

export function datasetCacheKey(ref: DatasetRef, ...parts: unknown[]): string {
  return JSON.stringify([ref.id, ref.version ?? '', ref.revision ?? '', ...parts]);
}

export type DatasetVersionInfo = {
  versions?: readonly string[];
  latest?: string | null;
};

export function datasetRef(id: string, version?: string): DatasetRef {
  return version ? { id, version } : { id };
}

export function resolveDatasetRef(
  id: string,
  version: string | undefined,
  info?: DatasetVersionInfo,
): { id: string; pinned?: string; ref: DatasetRef } {
  const listed = info?.versions;
  const pinned =
    version &&
    version !== (info?.latest ?? listed?.[0]) &&
    (!listed?.length || listed.includes(version))
      ? version
      : undefined;
  return { id, pinned, ref: { id, version: pinned } };
}

export function datasetUrlVersion(ref: DatasetRef): string | undefined {
  return ref.pin ?? (ref.revision ? undefined : ref.version);
}

export function versionSuffix(ref: DatasetRef): string {
  const pinned = datasetUrlVersion(ref);
  return pinned ? `&version=${encodeURIComponent(pinned)}` : '';
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
