import { createNamespacedLocaleCatalogs } from './lib/locales';
import { sortLangCodes } from './lib/code';
import type { Lang } from './types/locale';

export const locales = createNamespacedLocaleCatalogs(
  import.meta.glob('./locales/**/*.json', { eager: true, import: 'default' }),
);

export const uiLanguages = sortLangCodes([
  ...new Set(
    Object.values(locales).flatMap((catalog) => Object.keys(catalog)),
  ),
]) as Lang[];
