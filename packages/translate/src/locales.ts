import { createNamespacedLocaleCatalogs } from './lib/locales';

export const locales = createNamespacedLocaleCatalogs(
  import.meta.glob('./locales/**/*.json', { eager: true, import: 'default' }),
);
