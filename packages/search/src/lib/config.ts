import type { LangConfig } from '@terrafirmagreg-team/translate/lang';
import { createConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { LocalizedIndex } from './indexes';

export interface SearchConfig {

  indexes(): Promise<LocalizedIndex[]>;

  i18n(): LangConfig;
}

export const { register: registerSearchConfig, get: searchConfig } =
  createConfig<SearchConfig>('Search');

