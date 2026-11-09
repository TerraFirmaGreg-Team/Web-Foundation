import { sortLangCodes } from '@terrafirmagreg-team/translate/lib/code';
import { uiLanguages } from '@terrafirmagreg-team/translate/locales';
import type { DatasetCatalog, SectionSource } from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function sourceLanguages(source: SectionSource): Lang[] {
  const langs = new Set<string>();
  for (const page of source.getPages()) {
    const lang = page.path.split('/')[1];
    if (lang) langs.add(lang);
  }
  return sortLangCodes([...langs]) as Lang[];
}

export function siteLanguages(catalog: DatasetCatalog): Lang[] {
  const langs = new Set<string>(uiLanguages);
  for (const datasets of Object.values(catalog)) {
    for (const dataset of datasets) {
      for (const lang of dataset.languages ?? []) langs.add(lang);
    }
  }
  return sortLangCodes([...langs]) as Lang[];
}
