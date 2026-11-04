import { createLocaleCatalog } from '@terrafirmagreg-team/translate/lib/locales';

export const locales = createLocaleCatalog(
  import.meta.glob('./locales/*.json', { eager: true, import: 'default' }),
);

