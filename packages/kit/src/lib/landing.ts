import 'server-only';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { datasetSlugs, findDataset } from './datasets';
import type {
  DatasetLanding,
  SectionDataset,
  SectionKey,
} from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function getDatasetLanding(
  section: SectionKey,
  slug: string[] | undefined,
  lang: Lang,
  datasets: readonly SectionDataset[],
): DatasetLanding | undefined {
  if (!slug || slug.length !== 1) return undefined;
  const [ref] = slug;
  const meta = findDataset(datasets, { id: ref });
  if (!meta) return undefined;
  const { messages, defaultLanguage } = loadLocaleRegistry();
  const table = messages[lang] ?? messages[defaultLanguage] ?? {};
  return {
    title: table[`sections.${section}`] ?? section,
    description: table[`sections.desc.${section}`],
    dataset: { id: ref },
    datasetTitle: meta.title ?? meta.id,
    lang,
    ...(meta.versions ? { versions: meta.versions } : {}),
  };
}

export function resolveDatasetLanding(
  section: SectionKey,
  slug: string[] | undefined,
  lang: Lang,
  datasets: readonly SectionDataset[],
): { page: DatasetLanding; isFallback: boolean } | undefined {
  const page = getDatasetLanding(section, slug, lang, datasets);
  return page ? { page, isFallback: false } : undefined;
}

export async function generateDatasetLandingParams(
  section: SectionKey,
): Promise<{ slug: string[] }[]> {
  return (await datasetSlugs(section)).map((ref) => ({ slug: [ref] }));
}

