import 'server-only';
import type { HistoryOptions } from 'fumadocs-page-history/git';
import type { Repository } from 'fumadocs-page-history';

export interface HistoryLoaderOptions extends Omit<HistoryOptions, 'repository'> {
  repository: Repository;
}

export { compactTags } from './tags.ts';
