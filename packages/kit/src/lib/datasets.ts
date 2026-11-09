import 'server-only';
import { dynamicIconImports } from 'lucide-react/dynamic';
import { sectionConfig } from './config';
import { sections } from './sources';
import { datasetId } from './tree';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { serverCache } from '@terrafirmagreg-team/data/lib/server-cache';
import { dumpStatusSnapshot } from '@terrafirmagreg-team/data/lib/dump-status';
import { loadLocaleRegistry, sortLangCodes } from '@terrafirmagreg-team/translate/server';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { sectionTabs } from '@terrafirmagreg-team/sites/sections';
import type {
  DatasetCatalog,
  SectionDataset,
  SectionKey,
} from '@terrafirmagreg-team/kit/types';
import type { SectionDump } from './config';
import type { IconName } from 'lucide-react/dynamic';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

const CONTENT_DATASETS_TTL =
  process.env.NODE_ENV === 'development' ? 60_000 : undefined;

const staticSectionMeta = createAsyncCache(
  async (section: SectionKey): Promise<Map<string, Record<string, unknown>>> => {
    const map = new Map<string, Record<string, unknown>>();
    const source = await sections[section]?.getSource();
    if (source) {
      for (const node of source.getPageTree().children) {
        if (node.type !== 'folder') continue;
        const id = datasetId(node);
        const data = id
          ? (source.getNodeMeta?.(node) as { data?: Record<string, unknown> })
              ?.data
          : undefined;
        if (id && data) map.set(id, data);
      }
    }
    return map;
  },
  (section) => section,
  CONTENT_DATASETS_TTL,
);

async function contentSectionDatasets(
  section: SectionKey,
): Promise<SectionDataset[]> {
  const source = await sections[section]?.getSource();
  if (!source) return [];
  const languages = new Map<string, Set<string>>();
  for (const page of source.getPages()) {
    const [dataset, lang] = page.path.split('/');
    if (!dataset || !lang) continue;
    let set = languages.get(dataset);
    if (!set) languages.set(dataset, (set = new Set()));
    set.add(lang);
  }
  const meta = await staticSectionMeta(section);
  return [...languages.keys()].map((id) => ({
    id,
    languages: datasetLanguages([...(languages.get(id) ?? [])]),
    ...metaFields(meta.get(id) ?? {}),
    ...datasetAppearance(id),
  }));
}

async function datasetMeta(
  section: SectionKey,
  id: string,
): Promise<Omit<SectionDataset, 'id' | 'languages'>> {
  const meta = (await staticSectionMeta(section)).get(id);
  return meta ? metaFields(meta) : {};
}

async function sectionDatasetMeta(
  section: SectionKey,
  id: string,
): Promise<Omit<SectionDataset, 'id' | 'languages'>> {
  const meta = await datasetMeta(section, id);
  return Object.values(meta).some((value) => value !== undefined)
    ? meta
    : datasetMeta('docs', id);
}

const lastGoodDatasets = new Map<SectionKey, Map<string, SectionDataset>>();

function rememberDataset(section: SectionKey, row: SectionDataset) {
  let good = lastGoodDatasets.get(section);
  if (!good) lastGoodDatasets.set(section, (good = new Map()));
  good.set(row.id, row);
}

function datasetMembership(section: SectionKey, id: string): boolean {
  const declared = sectionConfig().datasetConfig[id]?.sections;
  if (declared) return Boolean(declared[section]);
  return lastGoodDatasets.get(section)?.has(id) === true;
}

function metaFields(
  meta: Record<string, unknown>,
): Omit<SectionDataset, 'id' | 'languages'> {
  const { title, description, icon } = meta;
  return {
    title: typeof title === 'string' ? title : undefined,
    description: typeof description === 'string' ? description : undefined,
    icon:
      typeof icon === 'string' && icon in dynamicIconImports
        ? (icon as IconName)
        : undefined,
  };
}

function datasetAppearance(id: string) {
  return { accent: sectionConfig().datasetConfig[id]?.accent };
}

function datasetLanguages(languages: readonly string[]): Lang[] {
  const central = sectionConfig().languages;
  if (central?.length) return sortLangCodes(central) as Lang[];
  if (languages.length) return sortLangCodes(languages) as Lang[];
  return [loadLocaleRegistry().defaultLanguage as Lang];
}

const DUMP_DATASETS_TTL = 60_000;

const dumpSectionDatasets = createAsyncCache(
  async (section: SectionKey, hasContent: (dump: SectionDump) => boolean) =>
    dumpDatasets(section, hasContent),
  (section) => section,
  DUMP_DATASETS_TTL,
);

const contentSectionDatasetsCached = createAsyncCache(
  async (section: SectionKey): Promise<SectionDataset[]> => {
    const rows = await contentSectionDatasets(section);
    rows.sort(datasetOrder);
    return rows;
  },
  (section) => section,
  CONTENT_DATASETS_TTL,
);

function datasetOrder(a: SectionDataset, b: SectionDataset): number {
  const cfg = sectionConfig().datasetConfig;
  const order = (cfg[a.id]?.order ?? 0) - (cfg[b.id]?.order ?? 0);
  return order !== 0 ? order : a.id.localeCompare(b.id);
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.');
  const pb = b.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d =
      (Number.parseInt(pa[i] ?? '0', 10) || 0) -
      (Number.parseInt(pb[i] ?? '0', 10) || 0);
    if (d) return d;
  }
  return a.localeCompare(b);
}

async function dumpDatasets(
  section: SectionKey,
  hasContent: (dump: SectionDump) => boolean,
): Promise<SectionDataset[]> {
  const dump = sectionConfig().dump;
  if (!dump) return [];
  const refs = await dump.discoverDatasets().catch(() => [] as DatasetRef[]);
  const versions = new Map<string, string[]>();
  const ids: string[] = [];
  if (refs.length) {
    for (const ref of refs) {
      const { id, version } = ref;
      if (version) {
        const list = versions.get(id) ?? [];
        list.push(version);
        versions.set(id, list);
      } else {
        ids.push(id);
      }
    }
  } else {
    for (const id of Object.keys(sectionConfig().datasetConfig)) {
      if (datasetMembership(section, id)) ids.push(id);
    }
  }
  return (
    await Promise.all(
      ids.map(async (id): Promise<SectionDataset | null> => {
        const index = await dump.loadDataset({ id }).catch(() => null);
        if (!index) {
          if (dumpStatusSnapshot().statuses[id]?.status !== 'failed')
            return null;
          const good = lastGoodDatasets.get(section)?.get(id);
          if (good) return good;
          if (!datasetMembership(section, id)) return null;
          return {
            id,
            languages: datasetLanguages([]),
            ...(await sectionDatasetMeta(section, id)),
            ...datasetAppearance(id),
          };
        }
        if (!hasContent(index)) return null;
        const row: SectionDataset = {
          id,
          languages: datasetLanguages(index.manifest.languages ?? []),
          ...(versions.get(id)?.length
            ? { versions: versions.get(id)!.sort(compareVersions).reverse() }
            : {}),
          ...(await sectionDatasetMeta(section, id)),
          ...datasetAppearance(id),
        };
        rememberDataset(section, row);
        return row;
      }),
    )
  )
    .filter((row): row is SectionDataset => row !== null)
    .sort(datasetOrder);
}

export function sectionDatasets(
  section: SectionKey,
): Promise<SectionDataset[]> {
  const hasContent = sectionConfig().dump?.hasContent[section];
  const promise = hasContent
    ? dumpSectionDatasets(section, hasContent)
    : contentSectionDatasetsCached(section);
  return promise.catch(() => []);
}

export async function defaultDataset(
  section: SectionKey,
): Promise<string | undefined> {
  return (await sectionDatasets(section))[0]?.id;
}

export function findDataset(
  datasets: readonly SectionDataset[],
  ref: DatasetRef,
): SectionDataset | undefined {
  const { id, version } = ref;
  const meta = datasets.find((row) => row.id === id);
  if (!meta) return undefined;
  if (version && !meta.versions?.includes(version)) return undefined;
  return meta;
}

export async function resolveDatasetMeta(
  section: SectionKey,
  ref: DatasetRef,
): Promise<SectionDataset | undefined> {
  return findDataset(await sectionDatasets(section), ref);
}

export async function datasetSlugs(section: SectionKey): Promise<string[]> {
  return (await sectionDatasets(section)).map(({ id }) => id);
}

async function buildDatasetCatalog(): Promise<DatasetCatalog> {
  return Promise.all(
    sectionTabs.map(
      async ({ key }) =>
        [key, await sectionDatasets(key).catch(() => [])] as const,
    ),
  ).then((rows) => Object.fromEntries(rows) as DatasetCatalog);
}

const datasetCatalogCached = createAsyncCache(
  async (): Promise<DatasetCatalog> => {
    const cache = serverCache();
    if (!cache) return buildDatasetCatalog();
    try {
      return (await cache(
        'dataset-catalog',
        buildDatasetCatalog,
        60,
      )) as DatasetCatalog;
    } catch {
      return buildDatasetCatalog();
    }
  },
  () => 'catalog',
  DUMP_DATASETS_TTL,
);

export function datasetCatalog(): Promise<DatasetCatalog> {
  return datasetCatalogCached();
}

