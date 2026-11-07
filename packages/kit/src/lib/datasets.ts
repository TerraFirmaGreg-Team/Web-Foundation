import 'server-only';
import { dynamicIconImports } from 'lucide-react/dynamic';
import { sectionConfig } from './config';
import { sections } from './sources';
import { datasetId } from './tree';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
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

const sectionMeta = new Map<
  SectionKey,
  Promise<Map<string, Record<string, unknown>>>
>();

function staticSectionMeta(
  section: SectionKey,
): Promise<Map<string, Record<string, unknown>>> {
  let meta = sectionMeta.get(section);
  if (meta) return meta;
  meta = (async () => {
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
  })();
  sectionMeta.set(section, meta);
  meta.catch(() => {
    if (sectionMeta.get(section) === meta) sectionMeta.delete(section);
  });
  return meta;
}

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
  const refs = await dump.discoverDatasets();
  const versions = new Map<string, string[]>();
  for (const ref of refs) {
    const { id, version } = ref;
    if (version) {
      const list = versions.get(id) ?? [];
      list.push(version);
      versions.set(id, list);
    }
  }
  const ids = refs.filter((ref) => !ref.version);
  const usable = await Promise.all(
    ids.map(async (ref) => {
      const { id } = ref;
      const index = await dump.loadDataset(ref).catch(() => null);
      if (!index || !hasContent(index)) return null;
      return {
        id,
        languages: datasetLanguages(index.manifest.languages ?? []),
      };
    }),
  );
  return (
    await Promise.all(
      usable
        .filter((row): row is { id: string; languages: Lang[] } => row !== null)
        .map(async ({ id, languages }) => ({
          id,
          languages,
          ...(versions.get(id)?.length
            ? { versions: versions.get(id)!.sort(compareVersions).reverse() }
            : {}),
          ...(await datasetMeta(section, id).then((meta) =>
            Object.values(meta).some((value) => value !== undefined)
              ? meta
              : datasetMeta('docs', id),
          )),
          ...datasetAppearance(id),
        })),
      )
  ).sort(datasetOrder);
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

const datasetCatalogCached = createAsyncCache(
  async (): Promise<DatasetCatalog> =>
    Promise.all(
      sectionTabs.map(
        async ({ key }) =>
          [key, await sectionDatasets(key).catch(() => [])] as const,
      ),
    ).then((rows) => Object.fromEntries(rows) as DatasetCatalog),
  () => 'catalog',
  DUMP_DATASETS_TTL,
);

export function datasetCatalog(): Promise<DatasetCatalog> {
  return datasetCatalogCached();
}

